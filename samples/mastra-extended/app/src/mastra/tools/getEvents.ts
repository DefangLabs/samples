import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { getItemsByType } from "@/lib/items";

const eventFilters = z.object({
  source: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  tag: z.string().min(2).optional(),
  query: z.string().min(2).optional(),
  limit: z.number().int().min(1).max(10).optional(),
});

export const getEvents = createTool({
  id: "getEvents",
  description: "Get event records. Filter by source, category, priority, tag, or a basic text query.",
  inputSchema: eventFilters,
  outputSchema: z.array(
    z.object({
      id: z.number(),
      source: z.string(),
      title: z.string(),
      body: z.string(),
      category: z.string().nullable(),
      priority: z.string().nullable(),
      tags: z.array(z.string()),
      createdAt: z.string(),
    }),
  ),
  execute: async (input) => {
    const { limit, ...filters } = input;
    const items = await getItemsByType("event", limit ?? 10, filters);
    return items.map((item) => ({
      id: item.id,
      source: item.source,
      title: item.title,
      body: item.body,
      category: item.category,
      priority: item.priority,
      tags: item.tags,
      createdAt: item.createdAt,
    }));
  },
});
