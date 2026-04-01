import { getDashboardSnapshot } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWorkspaceSnapshot = createTool({
  id: "getWorkspaceSnapshot",
  description: "Get top-level workspace counts and the latest sync job status.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    documentCount: z.number(),
    openTicketCount: z.number(),
    activityCount: z.number(),
    latestJob: z
      .object({
        id: z.string(),
        status: z.string(),
        progress: z.number(),
        summary: z.string().nullable(),
        error: z.string().nullable(),
        updatedAt: z.string(),
      })
      .nullable(),
  }),
  execute: async () => getDashboardSnapshot(),
});
