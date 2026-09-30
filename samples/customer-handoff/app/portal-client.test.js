import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHandoffInput,
  createInstallationHandoff,
  HandoffError,
  installationNameFor,
  readConfig,
} from "./portal-client.js";

const TENANT_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_ID = "00000000-0000-4000-8000-000000000002";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000003";
const LITERAL_HANDOFF_URL = `https://portal.dev.gnafed.click/clients/login?redirect=%2Finstallations%2F${INSTALLATION_ID}%2Fsetup`;

function config() {
  return readConfig({
    PORTAL_GRAPHQL_URL: "https://graphql.dev.gnafed.click/v1/graphql",
    PORTAL_HANDOFF_ORIGIN: "https://portal.dev.gnafed.click",
    PORTAL_ACCESS_TOKEN: "test-token-value",
    DEFANG_TENANT_ID: TENANT_ID,
    DEFANG_PROJECT_ID: PROJECT_ID,
    DEFANG_CLOUD_PROVIDER: "aws",
    GITHUB_ORG: "example-org",
    GITHUB_REPOSITORY: "example-app",
    GITHUB_REF_TYPE: "environment",
    GITHUB_REF_PATTERN: "defang-production",
  });
}

function event(overrides = {}) {
  return {
    customerEmail: "Cloud.Owner@Example.com",
    externalReference: "order_demo_001",
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

describe("handoff input", () => {
  it("derives a stable opaque installation name from the external reference", () => {
    const first = installationNameFor("customer", "order_demo_001");
    const retry = installationNameFor("customer", "order_demo_001");
    const different = installationNameFor("customer", "order_demo_002");

    assert.equal(first, retry);
    assert.notEqual(first, different);
    assert.match(first, /^customer-[0-9a-f]{24}$/);
    assert.equal(first.includes("order_demo_001"), false);
  });

  it("keeps the payment reference out of the Portal request", () => {
    const input = buildHandoffInput(config(), event());
    assert.equal(input.customerEmail, "cloud.owner@example.com");
    assert.equal(input.repoPattern, "example-app");
    assert.equal(JSON.stringify(input).includes("order_demo_001"), false);
  });

  it("rejects missing business input as a client error", () => {
    assert.throws(
      () =>
        buildHandoffInput(config(), {
          customerEmail: "cloud-owner@example.com",
        }),
      (error) =>
        error instanceof HandoffError &&
        error.status === 400 &&
        error.message === "External reference is required.",
    );
  });
});

describe("Portal client", () => {
  it("uses the server credential and returns Portal's exact handoff URL", async () => {
    let request;
    const handoff = await createInstallationHandoff({
      config: config(),
      event: event(),
      fetchImpl: async (url, init) => {
        request = { url, init };
        return jsonResponse({
          data: {
            createInstallationHandoff: {
              installationId: INSTALLATION_ID,
              status: "pending",
              handoffUrl: LITERAL_HANDOFF_URL,
            },
          },
        });
      },
    });

    assert.equal(request.url, "https://graphql.dev.gnafed.click/v1/graphql");
    assert.equal(request.init.headers.authorization, "Bearer test-token-value");
    assert.equal(handoff.status, "pending");
    assert.equal(handoff.handoffUrl, LITERAL_HANDOFF_URL);
  });

  it("sends the same request and gets the same installation on a retry", async () => {
    const requests = [];
    const fetchImpl = async (_url, init) => {
      requests.push(JSON.parse(init.body));
      return jsonResponse({
        data: {
          createInstallationHandoff: {
            installationId: INSTALLATION_ID,
            status: "pending",
            handoffUrl: LITERAL_HANDOFF_URL,
          },
        },
      });
    };

    const first = await createInstallationHandoff({
      config: config(),
      event: event(),
      fetchImpl,
    });
    const retry = await createInstallationHandoff({
      config: config(),
      event: event(),
      fetchImpl,
    });

    assert.deepEqual(requests[0], requests[1]);
    assert.equal(first.installationId, retry.installationId);
    assert.equal(first.handoffUrl, retry.handoffUrl);
  });

  it("rejects a handoff URL outside the configured Portal origin", async () => {
    await assert.rejects(
      createInstallationHandoff({
        config: config(),
        event: event(),
        fetchImpl: async () =>
          jsonResponse({
            data: {
              createInstallationHandoff: {
                installationId: INSTALLATION_ID,
                status: "pending",
                handoffUrl: "https://attacker.example/handoff",
              },
            },
          }),
      }),
      (error) =>
        error instanceof HandoffError &&
        error.message ===
          "Portal returned a handoff URL outside PORTAL_HANDOFF_ORIGIN.",
    );
  });

  it("rejects a status outside the current create-handoff contract", async () => {
    await assert.rejects(
      createInstallationHandoff({
        config: config(),
        event: event(),
        fetchImpl: async () =>
          jsonResponse({
            data: {
              createInstallationHandoff: {
                installationId: INSTALLATION_ID,
                status: "succeeded",
                handoffUrl: LITERAL_HANDOFF_URL,
              },
            },
          }),
      }),
      (error) =>
        error instanceof HandoffError &&
        error.message === "Portal returned an invalid handoff.",
    );
  });

  it("does not expose an unexpected upstream error", async () => {
    await assert.rejects(
      createInstallationHandoff({
        config: config(),
        event: event(),
        fetchImpl: async () =>
          jsonResponse({ errors: [{ message: "database detail: secret" }] }),
      }),
      (error) =>
        error instanceof HandoffError &&
        error.message ===
          "Portal could not create the handoff. Check the server configuration and retry.",
    );
  });
});
