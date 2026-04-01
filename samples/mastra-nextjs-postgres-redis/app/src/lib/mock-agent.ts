import { getDashboardSnapshot, getOpenTickets, getRecentActivities, searchDocuments } from "@/lib/domain";

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

export async function getMockReply(message: string) {
  const snapshot = await getDashboardSnapshot();
  const normalizedMessage = message.toLowerCase();

  if (snapshot.documentCount === 0) {
    return [
      "The workspace has not been synced yet.",
      "",
      "Click `Sync sample workspace` first so the worker can load the sample runbooks, tickets, and activity feed.",
    ].join("\n");
  }

  const [tickets, docs, activities] = await Promise.all([
    getOpenTickets(),
    searchDocuments(message),
    getRecentActivities(3),
  ]);

  if (normalizedMessage.includes("release note") || normalizedMessage.includes("release notes")) {
    return [
      "Draft release notes:",
      "- Improved checkout resilience with new retry logic around confirmation webhooks.",
      "- Added dashboard latency instrumentation to make incident triage faster for the support team.",
      "- Known issue: enterprise SSO callbacks are still unstable and should be monitored during rollout.",
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
    const relatedDocs = await searchDocuments("incident support launch");

    return [
      "Recommended on-call focus:",
      `- Start with ${topTicket.externalId}: ${topTicket.title}. It is the only critical ticket and it affects enterprise authentication loops.`,
      "- Next, confirm whether delayed checkout confirmations are increasing support volume for EU customers.",
      "- Hold feature-flag cleanup until the auth and checkout path are stable.",
      "",
      "Runbooks to review:",
      formatDocuments(relatedDocs.slice(0, 2)),
      "",
      "Ticket queue:",
      formatTickets(tickets.slice(0, 3)),
    ].join("\n");
  }

  return [
    "Support and ops snapshot:",
    `- Open tickets: ${snapshot.openTicketCount}`,
    `- Knowledge docs: ${snapshot.documentCount}`,
    `- Recent activity items: ${snapshot.activityCount}`,
    "",
    "Highest-priority tickets:",
    formatTickets(tickets.slice(0, 3)),
    "",
    "Relevant documents:",
    docs.length > 0 ? formatDocuments(docs) : "- No matching documents found. Ask after syncing or use a broader query.",
    "",
    "Latest activity:",
    formatActivities(activities),
  ].join("\n");
}
