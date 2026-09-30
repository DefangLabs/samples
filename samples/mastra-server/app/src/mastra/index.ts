/**
 * The Mastra server.
 *
 * `mastra build --studio` turns this file into a self-contained Node.js server
 * in `.mastra/output` that serves the agent API and the Studio UI on one port.
 * That server is the same artifact the Mastra Helm chart runs in Kubernetes;
 * here Defang runs it as an ordinary container.
 */

import { Mastra } from "@mastra/core/mastra";
import { SimpleAuth } from "@mastra/core/server";

import { assistantAgent } from "./agents/assistant";
import { storage } from "./storage";

/**
 * Token gate for both the API and the Studio UI.
 *
 * `compose.yaml` declares MASTRA_API_TOKEN with no value, so Defang refuses to
 * deploy until it is set. Local development leaves it empty on purpose, which
 * is why an empty token is allowed here and logs a warning.
 *
 * `/health` stays public: the container health check and the cloud load
 * balancer both call it without credentials.
 */
function getAuth() {
  const token = process.env.MASTRA_API_TOKEN;
  if (!token) {
    console.warn(
      "MASTRA_API_TOKEN is not set: the agent API and Studio are open to anyone who can reach this server.",
    );
    return undefined;
  }

  return new SimpleAuth<{ id: string; name: string }>({
    tokens: { [token]: { id: "api-client", name: "API client" } },
    public: ["/health"],
  });
}

export const mastra = new Mastra({
  agents: { assistantAgent },
  storage,
  server: { auth: getAuth() },
});
