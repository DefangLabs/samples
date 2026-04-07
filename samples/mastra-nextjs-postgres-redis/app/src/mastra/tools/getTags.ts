import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getAvailableTags } from "@/lib/items";

export const getTags = createTool({
  id: "getTags",
  description: "List classification tags available on tasks and events, optionally filtered by item type.",
  inputSchema: z.object({
    itemType: z.enum(["task", "event"]).optional(),
  }),
  outputSchema: z.array(
    z.object({
      tag: z.string(),
      count: z.number(),
    }),
  ),
  execute: async (input) => getAvailableTags(input.itemType),
});
