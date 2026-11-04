import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createAppServer } from "./server.js";

const TENANT_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_ID = "00000000-0000-4000-8000-000000000002";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000003";
const HANDOFF_URL = `https://portal.dev.gnafed.click/clients/login?redirect=%2Finstallations%2F${INSTALLATION_ID}%2Fsetup`;

const originalFetch = globalThis.fetch;
let upstreamRequest;
let upstreamResponse;
let server;
let baseUrl;

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function post(path, body) {
  return originalFetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("demo server", () => {
  before(async () => {
    globalThis.fetch = async (url, init) => {
      upstreamRequest = { url: url.toString(), init };
      return jsonResponse(upstreamResponse);
    };
    server = createAppServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    globalThis.fetch = originalFetch;
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it("serves its health check without Portal access", async () => {
    const response = await originalFetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
  });

  it("loads the authenticated developer context", async () => {
    upstreamResponse = {
      data: {
        tenants: [{ id: TENANT_ID, name: "Example", ownerId: TENANT_ID }],
        projects: [
          { id: PROJECT_ID, tenantId: TENANT_ID, name: "demo", label: "Demo" },
        ],
      },
    };

    const response = await post("/api/context", { token: "developer-token" });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.projects[0].id, PROJECT_ID);
    assert.equal(upstreamRequest.init.headers.authorization, "Bearer developer-token");
  });

  it("returns Portal's literal customer handoff URL", async () => {
    upstreamResponse = {
      data: {
        createInstallationHandoff: {
          installationId: INSTALLATION_ID,
          status: "pending",
          handoffUrl: HANDOFF_URL,
        },
      },
    };

    const response = await post("/api/handoffs", {
      token: "developer-token",
      input: {
        tenantId: TENANT_ID,
        customerEmail: "cloud-owner@example.com",
        projectId: PROJECT_ID,
        installationName: "customer-production",
        recipe: "default",
        stackName: "production",
        cloudProvider: "aws",
        githubOrg: "example-org",
        repoPattern: "customer-*",
        refType: "environment",
        refPattern: "production",
      },
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.handoffUrl, HANDOFF_URL);
    const upstreamBody = JSON.parse(upstreamRequest.init.body);
    assert.equal(upstreamBody.variables.input.projectId, PROJECT_ID);
  });
});
