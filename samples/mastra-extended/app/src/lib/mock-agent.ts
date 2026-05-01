import { embedTextForSearch } from "@/lib/ai";
import { getItemCounts, getItemsByType, searchItemsByEmbedding } from "@/lib/items";

export async function getMockReply(message: string) {
  const snapshot = await getItemCounts();

  if (snapshot.taskCount === 0 && snapshot.eventCount === 0) {
    return [
      "No sample items are loaded yet.",
      "",
      "Click `Generate sample items` to create 10 tasks and 10 events, then ask again.",
    ].join("\n");
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("similar") || normalized.includes("related") || normalized.includes("pattern")) {
    const embedding = await embedTextForSearch(message);
    const matches = await searchItemsByEmbedding(embedding, undefined, 3);

    return [
      "Most similar items:",
      ...matches.map(({ item, score }) => `- ${item.title} (${item.itemType}, ${item.source}, score ${score})`),
    ].join("\n");
  }

  const [tasks, events] = await Promise.all([getItemsByType("task", 3), getItemsByType("event", 3)]);

  return [
    `Current state: ${snapshot.taskCount} tasks, ${snapshot.eventCount} events, ${snapshot.classifiedCount} classified items.`,
    "",
    "Top tasks:",
    ...tasks.map((task) => `- ${task.title} (${task.status ?? "open"}, ${task.priority ?? "pending"})`),
    "",
    "Recent events:",
    ...events.map((event) => `- ${event.title} (${event.source})`),
  ].join("\n");
}
