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
import { getStorage } from "./storage";

type ApiUser = { id: string; name: string };

/**
 * Token gate for the API and the Studio UI.
 *
 * `compose.yaml` declares MASTRA_API_TOKEN with no value, so Defang refuses to
 * deploy until you run `defang config set MASTRA_API_TOKEN`. Local development
 * leaves it empty on purpose, which is why an empty token is allowed here and
 * why it logs a warning.
 *
 * `/health` stays public because the container health check and the cloud load
 * balancer both call it without credentials.
 *
 * SimpleAuth is a static token list. For real user identity use one of Mastra's
 * identity providers (JWT, Clerk, WorkOS, Auth0, Firebase, Supabase) instead.
 */
function getAuth() {
  const token = process.env.MASTRA_API_TOKEN;
  if (!token) {
    console.warn(
      "MASTRA_API_TOKEN is not set: the agent API and Studio are open to anyone who can reach this server.",
    );
    return undefined;
  }

  return new SimpleAuth<ApiUser>({
    tokens: { [token]: { id: "api-client", name: "API client" } },
    public: ["/health"],
  });
}

export const mastra = new Mastra({
  agents: { assistantAgent },
  storage: getStorage(),
  server: {
    port: Number(process.env.PORT ?? 4111),
    auth: getAuth(),
  },
});
