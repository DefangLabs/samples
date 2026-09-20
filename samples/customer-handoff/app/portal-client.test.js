import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createInstallationHandoff,
  getDemoContext,
  PortalRequestError,
  validateHandoffInput,
} from "./portal-client.js";

const TENANT_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_ID = "00000000-0000-4000-8000-000000000002";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000003";

function input(overrides = {}) {
  return {
    tenantId: TENANT_ID,
    customerEmail: "Cloud.Owner@Example.com",
    projectId: PROJECT_ID,
    installationName: "customer-production",
    recipe: "default",
    stackName: "production",
    cloudProvider: "aws",
    githubOrg: "example-org",
    repoPattern: "customer-*",
    refType: "environment",
    refPattern: "production",
    ...overrides,
  };
}

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });
}

describe("validateHandoffInput", () => {
  it("normalizes the customer email and clears the all-refs pattern", () => {
    const result = validateHandoffInput(
      input({ refType: "all", refPattern: "ignored" }),
    );
    assert.equal(result.customerEmail, "cloud.owner@example.com");
    assert.equal(result.refPattern, null);
  });

  it("requires a reference pattern for a branch", () => {
    assert.throws(
      () => validateHandoffInput(input({ refType: "branch", refPattern: "" })),
      (error) =>
        error instanceof PortalRequestError &&
        error.message === "Git reference pattern is required.",
    );
  });
});
describe("Portal client", () => {
  it("loads authorized workspaces and projects with the developer token", async () => {
    let request;
    const context = await getDemoContext({
      graphqlUrl: "https://graphql.example.com/v1/graphql",
      token: "developer-token",
      fetchImpl: async (url, init) => {
        request = { url: url.toString(), init };
        return jsonResponse({
          data: {
            tenants: [{ id: TENANT_ID, name: "Example", ownerId: TENANT_ID }],
            projects: [
              {
                id: PROJECT_ID,
                tenantId: TENANT_ID,
                name: "demo",
                label: "Demo",
              },
            ],
          },
        });
      },
    });

    assert.equal(request.url, "https://graphql.example.com/v1/graphql");
    assert.equal(request.init.headers.authorization, "Bearer developer-token");
    assert.equal(context.tenants[0].name, "Example");
    assert.equal(context.projects[0].label, "Demo");
  });

  it("returns the exact handoff URL supplied by Portal", async () => {
    const literalUrl = `https://portal.dev.gnafed.click/clients/login?redirect=%2Finstallations%2F${INSTALLATION_ID}%2Fsetup`;
    let variables;
    const handoff = await createInstallationHandoff({
      graphqlUrl: "https://graphql.dev.gnafed.click/v1/graphql",
      token: "developer-token",
      input: input(),
      fetchImpl: async (_url, init) => {
        variables = JSON.parse(init.body).variables;
        return jsonResponse({
          data: {
            createInstallationHandoff: {
              installationId: INSTALLATION_ID,
              status: "pending",
              handoffUrl: literalUrl,
            },
          },
        });
      },
    });

    assert.equal(variables.input.customerEmail, "cloud.owner@example.com");
    assert.equal(handoff.handoffUrl, literalUrl);
  });

  it("does not expose an invalid upstream response", async () => {
    await assert.rejects(
      createInstallationHandoff({
        graphqlUrl: "https://graphql.example.com/v1/graphql",
        token: "developer-token",
        input: input(),
        fetchImpl: async () => jsonResponse({ errors: [{ message: "unexpected" }] }),
      }),
      (error) =>
        error instanceof PortalRequestError &&
        error.message ===
          "Portal could not process the request. Check the details and try again.",
    );
  });
});
