/**
 * A tool that reports facts about the container answering the request.
 *
 * This is deliberately self-contained: it needs no external API key and no
 * seed data, so the sample deploys and works immediately. It is also the
 * quickest way to see that a scaled deployment is really load balanced —
 * ask "which instance is this?" a few times and watch `instance` change.
 */

import { createTool } from "@mastra/core/tools";
import { hostname } from "node:os";
import { z } from "zod";

export const serverInfo = createTool({
  id: "serverInfo",
  description:
    "Report runtime facts about the Mastra server instance that is handling this request: " +
    "instance id, uptime, Node.js version, and which backing services are configured.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    instance: z.string().describe("Hostname of the container handling this request"),
    uptimeSeconds: z.number(),
    nodeVersion: z.string(),
    storage: z.string().describe("Which storage backend holds durable state"),
    authEnabled: z.boolean(),
  }),
  execute: async () => ({
    instance: hostname(),
    uptimeSeconds: Math.round(process.uptime()),
    nodeVersion: process.version,
    storage: process.env.DATABASE_URL ? "PostgreSQL" : "not configured",
    authEnabled: Boolean(process.env.MASTRA_API_TOKEN),
  }),
});
