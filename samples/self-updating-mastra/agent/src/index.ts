import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { registerAdminRoutes } from "./admin.js";
import { ensureAgentSchema } from "./db.js";

const PORT = Number(process.env.AGENT_PORT ?? 4111);

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

// The admin console is served from here — outside the Next.js app the coding
// agent edits — so it stays usable even when a bad edit breaks the app. Caddy
// routes /admin* to this server; everything else goes to Next.js.
registerAdminRoutes(app);

// Ensure the run-history table exists before serving. Retry briefly in case the
// database isn't reachable the instant this process starts.
async function ensureSchemaWithRetry(attempts = 10): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    try {
      await ensureAgentSchema();
      return;
    } catch (err) {
      console.error(`ensureAgentSchema attempt ${i + 1} failed`, err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

await ensureSchemaWithRetry();

serve({ fetch: app.fetch, port: PORT, hostname: "127.0.0.1" }, (info) => {
  console.log(`Coding agent + admin console listening on 127.0.0.1:${info.port}`);
});
