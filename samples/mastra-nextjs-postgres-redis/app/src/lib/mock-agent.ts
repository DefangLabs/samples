import {
  getDashboardSnapshot,
  getOpenTickets,
  getRecentActivities,
  searchDocuments,
  searchTriageInsights,
} from "@/lib/domain";
import { companyContext } from "@/lib/demo";

function formatTickets(tickets: Awaited<ReturnType<typeof getOpenTickets>>) {
  return tickets
    .map(
      (ticket) =>
        `- ${ticket.externalId} (${ticket.priority}, ${ticket.status}) owned by ${ticket.owner}: ${ticket.title}. ${ticket.summary}`,
    )
    .join("\n");
}

function formatDocuments(docs: Awaited<ReturnType<typeof searchDocuments>>) {
  return docs
    .map((doc) => `- ${doc.title} [${doc.category}]: ${doc.content}`)
    .join("\n");
}

function formatActivities(activities: Awaited<ReturnType<typeof getRecentActivities>>) {
  return activities
    .map((activity) => `- ${activity.title} (${activity.kind} at ${activity.occurredAt}): ${activity.body}`)
    .join("\n");
}

function formatInsights(insights: Awaited<ReturnType<typeof searchTriageInsights>>) {
  return insights
    .map(
      (insight) =>
        `- ${insight.externalId} (${insight.entityType}, risk ${insight.riskScore}, ${insight.category}): ${insight.title}. Action: ${insight.recommendedAction}`,
    )
    .join("\n");
}

export async function getMockReply(message: string) {
  const snapshot = await getDashboardSnapshot();
  const normalizedMessage = message.toLowerCase();

  if (snapshot.documentCount === 0) {
    return [
      "The app has not been seeded yet.",
      "",
      "Click `Generate sample activity` first so the worker can load reference docs, tasks, and event data.",
    ].join("\n");
  }

  const [tickets, docs, activities] = await Promise.all([
    getOpenTickets(),
    searchDocuments(message),
    getRecentActivities(3),
  ]);

  if (
    normalizedMessage.includes("similar") ||
    normalizedMessage.includes("pattern") ||
    normalizedMessage.includes("related incident")
  ) {
    const insights = await searchTriageInsights(message);
    return [
      "Most similar triaged events:",
      insights.length > 0 ? formatInsights(insights) : "- No semantically similar events found yet.",
    ].join("\n");
  }

  if (normalizedMessage.includes("release note") || normalizedMessage.includes("release notes")) {
    return [
      "Draft release notes:",
      "- Improved Jira and GitHub import resilience with new retry logic for large workspace migrations.",
      "- Added roadmap snapshot instrumentation to make planning-week triage faster for the customer-ops team.",
      "- Known issue: some enterprise workspaces may still show stale executive dashboards after heavy Jira re-syncs.",
      "",
      "Source activity:",
      formatActivities(activities),
    ].join("\n");
  }

  if (
    normalizedMessage.includes("on-call") ||
    normalizedMessage.includes("look at first") ||
    normalizedMessage.includes("highest priority")
  ) {
    const topTicket = tickets[0];
    const relatedDocs = await searchDocuments("workspace import planning incident");

    return [
      "Recommended on-call focus:",
      `- Start with ${topTicket.externalId}: ${topTicket.title}. It is the highest-risk task in the queue.`,
      "- Next, confirm whether stale portfolio summaries or import delays are spreading to additional accounts.",
      "- Hold lower-priority cleanup unless it is directly tied to the active incident.",
      "",
      "Reference docs to review:",
      formatDocuments(relatedDocs.slice(0, 2)),
      "",
      "Ticket queue:",
      formatTickets(tickets.slice(0, 3)),
    ].join("\n");
  }

  return [
    `${companyContext.commandCenterName} snapshot:`,
    `- Open tasks: ${snapshot.openTicketCount}`,
    `- Reference docs: ${snapshot.documentCount}`,
    `- Recent events: ${snapshot.activityCount}`,
    "",
    "Highest-priority tasks:",
    formatTickets(tickets.slice(0, 3)),
    "",
    "Relevant documents:",
    docs.length > 0 ? formatDocuments(docs) : "- No matching documents found. Ask after syncing or use a broader query.",
    "",
    "Latest events:",
    formatActivities(activities),
  ].join("\n");
}
