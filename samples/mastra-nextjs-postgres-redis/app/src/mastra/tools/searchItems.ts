import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { embedTextForSearch } from "@/lib/ai";
import { searchItemsByEmbedding } from "@/lib/items";

export const searchItems = createTool({
  id: "searchItems",
  description: "Find similar items using the stored embeddings for tasks and events.",
  inputSchema: z.object({
    query: z.string().min(3),
    itemType: z.enum(["task", "event"]).optional(),
    tag: z.string().min(2).optional(),
    category: z.string().min(2).optional(),
    priority: z.enum(["low", "medium", "high", "critical"]).optional(),
    source: z.string().min(2).optional(),
    limit: z.number().int().min(1).max(5).optional(),
  }),
  outputSchema: z.array(
    z.object({
      id: z.number(),
      itemType: z.enum(["task", "event"]),
      source: z.string(),
      title: z.string(),
      body: z.string(),
      category: z.string().nullable(),
      priority: z.string().nullable(),
      tags: z.array(z.string()),
      score: z.number(),
    }),
  ),
  execute: async (input) => {
    const embedding = await embedTextForSearch(input.query);
    const { query, itemType, limit, ...filters } = input;
    const matches = await searchItemsByEmbedding(embedding, itemType, limit ?? 5, filters);
    return matches.map(({ item, score }) => ({
      id: item.id,
      itemType: item.itemType,
      source: item.source,
      title: item.title,
      body: item.body,
      category: item.category,
      priority: item.priority,
      tags: item.tags,
      score,
    }));
  },
});
