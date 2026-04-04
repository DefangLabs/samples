import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { searchTriageInsights } from "@/lib/domain";

export const searchWorkspaceTriageInsights = createTool({
  id: "searchWorkspaceTriageInsights",
  description:
    "Semantic search over triaged ticket/activity insights using embedding similarity. Use this when the user asks for related incidents, patterns, or historical parallels.",
  inputSchema: z.object({
    query: z.string().describe("Question or incident description to match against triaged operational events."),
  }),
  outputSchema: z.array(
    z.object({
      entityType: z.enum(["ticket", "activity"]),
      externalId: z.string(),
      title: z.string(),
      body: z.string(),
      category: z.string(),
      priority: z.string(),
      riskScore: z.number(),
      tags: z.array(z.string()),
      recommendedAction: z.string(),
      searchSummary: z.string(),
      score: z.number(),
    }),
  ),
  execute: async ({ context }) => searchTriageInsights(context.query),
});
