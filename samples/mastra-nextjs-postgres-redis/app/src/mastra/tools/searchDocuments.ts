import { searchDocuments } from "@/lib/domain";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const searchWorkspaceDocuments = createTool({
  id: "searchWorkspaceDocuments",
  description: "Search the synced support docs and runbooks for relevant information.",
  inputSchema: z.object({
    query: z.string().describe("The question or phrase to search for."),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      content: z.string(),
    }),
  ),
  execute: async ({ context }) => searchDocuments(context.query),
});
