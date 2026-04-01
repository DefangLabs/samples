import { getOpenTickets } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getWorkspaceOpenTickets = createTool({
  id: "getWorkspaceOpenTickets",
  description: "Get the open support tickets ordered by priority.",
  inputSchema: z.object({}),
  outputSchema: z.array(
    z.object({
      externalId: z.string(),
      title: z.string(),
      status: z.string(),
      priority: z.string(),
      owner: z.string(),
      summary: z.string(),
    }),
  ),
  execute: async () => getOpenTickets(),
});
