import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { readConfig } from "./portal-client.js";
import { createAppServer } from "./server.js";

const TENANT_ID = "00000000-0000-4000-8000-000000000001";
const PROJECT_ID = "00000000-0000-4000-8000-000000000002";
const INSTALLATION_ID = "00000000-0000-4000-8000-000000000003";
const HANDOFF_URL = `https://portal.dev.gnafed.click/clients/login?redirect=%2Finstallations%2F${INSTALLATION_ID}%2Fsetup`;
const SECRET_TOKEN = "never-log-this-token";

const config = readConfig({
  PORTAL_GRAPHQL_URL: "https://graphql.dev.gnafed.click/v1/graphql",
  PORTAL_HANDOFF_ORIGIN: "https://portal.dev.gnafed.click",
  PORTAL_ACCESS_TOKEN: SECRET_TOKEN,
  DEFANG_TENANT_ID: TENANT_ID,
  DEFANG_PROJECT_ID: PROJECT_ID,
  DEFANG_CLOUD_PROVIDER: "aws",
  GITHUB_ORG: "example-org",
  GITHUB_REPOSITORY: "example-app",
  GITHUB_REF_TYPE: "environment",
  GITHUB_REF_PATTERN: "production",
});

const logs = [];
let upstreamRequest;
let server;
let baseUrl;

function jsonResponse(payload) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

describe("sample server", () => {
  before(async () => {
    server = createAppServer({
      config,
      logger: {
        info: (message) => logs.push(message),
        error: (message) => logs.push(message),
      },
      fetchImpl: async (url, init) => {
        upstreamRequest = { url, init };
        return jsonResponse({
          data: {
            createInstallationHandoff: {
              installationId: INSTALLATION_ID,
              status: "pending",
              handoffUrl: HANDOFF_URL,
            },
          },
        });
      },
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  });

  it("serves health and the form without exposing the server credential", async () => {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { status: "ok" });

    const page = await fetch(baseUrl);
    const html = await page.text();
    assert.equal(page.status, 200);
    assert.match(html, /Create handoff and continue/);
    assert.equal(html.includes(SECRET_TOKEN), false);
  });

  it("redirects to the exact literal returned by Portal and logs no secret", async () => {
    const response = await fetch(`${baseUrl}/handoff`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        customerEmail: "cloud-owner@example.com",
        externalReference: "order_demo_001",
      }),
      redirect: "manual",
    });

    assert.equal(response.status, 303);
    assert.equal(response.headers.get("location"), HANDOFF_URL);
    assert.equal(
      upstreamRequest.init.headers.authorization,
      `Bearer ${SECRET_TOKEN}`,
    );
    const serializedLogs = logs.join("\n");
    assert.equal(serializedLogs.includes(SECRET_TOKEN), false);
    assert.equal(serializedLogs.includes("cloud-owner@example.com"), false);
    assert.equal(serializedLogs.includes("order_demo_001"), false);
    assert.equal(serializedLogs.includes(HANDOFF_URL), false);
    assert.match(serializedLogs, new RegExp(INSTALLATION_ID));
  });
});
