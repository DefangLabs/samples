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
import { PinoLogger } from "@mastra/loggers";

import { assistantAgent } from "./agents/assistant";
import { getStorage } from "./storage";

type ApiUser = { id: string; name: string };

/**
 * Token gate for the API and the Studio UI.
 *
 * Without this, every deployed agent endpoint is open to the internet and
 * anyone who finds the URL can spend your model budget. Set the token with
 * `defang config set MASTRA_API_TOKEN` — it is never committed.
 *
 * `/health` stays public because the container health check and the cloud load
 * balancer both call it without credentials.
 *
 * SimpleAuth is a static token list. For real user identity use one of Mastra's
 * identity providers (JWT, Clerk, WorkOS, Auth0, Firebase, Supabase) instead.
 */
function getAuth() {
  const token = process.env.MASTRA_API_TOKEN;
  if (!token) return undefined;

  return new SimpleAuth<ApiUser>({
    tokens: { [token]: { id: "api-client", name: "API client" } },
    public: ["/health"],
  });
}

export const mastra = new Mastra({
  agents: { assistantAgent },
  storage: getStorage(),
  logger: new PinoLogger({ name: "mastra-server", level: "info" }),
  server: {
    port: Number(process.env.PORT ?? 4111),
    auth: getAuth(),
  },
});
