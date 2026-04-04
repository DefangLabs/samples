import { getOpenTickets } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWorkspaceOpenTickets = createTool({
  id: "getWorkspaceOpenTickets",
  description: "Get the open customer-workspace escalations ordered by priority.",
  inputSchema: z.object({}),
  outputSchema: z.array(
    z.object({
      externalId: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      owner: z.string(),
      summary: z.string(),
      source: z.string(),
      customer: z.string().nullable(),
      tags: z.array(z.string()),
      category: z.string().nullable(),
      riskScore: z.number().nullable(),
      recommendedAction: z.string().nullable(),
    }),
  ),
  execute: async () => getOpenTickets(),
});
