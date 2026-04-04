import { getRecentActivities } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWorkspaceRecentActivities = createTool({
  id: "getWorkspaceRecentActivities",
  description: "Get recent deployment, incident, integration, and customer-success activity across Sprintlane workspaces.",
  inputSchema: z.object({
    limit: z.number().int().min(1).max(10).default(5),
  }),
  outputSchema: z.array(
    z.object({
      externalId: z.string(),
      kind: z.string(),
      title: z.string(),
      body: z.string(),
      source: z.string(),
      customer: z.string().nullable(),
      tags: z.array(z.string()),
      category: z.string().nullable(),
      riskScore: z.number().nullable(),
      occurredAt: z.string(),
    }),
  ),
  execute: async ({ context }) => getRecentActivities(context.limit),
});
