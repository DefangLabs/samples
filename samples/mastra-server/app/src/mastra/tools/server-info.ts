// Reports facts about the container answering the request. Needs no API key and
// no seed data, so the sample works the moment it deploys. Ask "which instance
// is this?" a few times on a scaled deployment and watch `instance` change.

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
