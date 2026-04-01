import { getRecentActivities } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWorkspaceRecentActivities = createTool({
  id: "getWorkspaceRecentActivities",
  description: "Get the recent deployment, incident, and customer escalation activity.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(10).default(5),
  }),
  outputSchema: z.array(
    z.object({
      kind: z.string(),
      title: z.string(),
      body: z.string(),
      occurredAt: z.string(),
    }),
  ),
  execute: async ({ context }) => getRecentActivities(context.limit),
});
