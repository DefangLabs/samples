import { getDashboardSnapshot } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWorkspaceSnapshot = createTool({
  id: "getWorkspaceSnapshot",
  description: "Get top-level Sprintlane Mission Control counts and the latest simulation job status.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    documentCount: z.number(),
    openTicketCount: z.number(),
    activityCount: z.number(),
    triagedCount: z.number(),
    latestJob: z
      .object({
        id: z.string(),
        status: z.string(),
        progress: z.number(),
        summary: z.string().nullable(),
        error: z.string().nullable(),
        profile: z.string().nullable(),
        scaleFactor: z.number().nullable(),
        durationSeconds: z.number().nullable(),
        updatedAt: z.string(),
      })
      .nullable(),
  }),
  execute: async () => getDashboardSnapshot(),
});
