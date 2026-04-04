export const sampleDocuments = [
  {
    slug: "enterprise-rollout",
    title: "Enterprise rollout runbook",
    category: "runbook",
    content:
      "Before onboarding a new Sprintlane customer workspace, confirm Jira, GitHub, and Slack imports finish within SLA, verify AI sprint-plan generation completes with linked PR data, and route Sev1 rollout blockers to the on-call engineer within five minutes."
  },
  {
    slug: "workspace-sync-incidents",
    title: "Workspace sync incident guide",
    category: "runbook",
    content:
      "Sev1 Sprintlane incidents require an incident commander, customer-safe updates every fifteen minutes, and a rollback decision within thirty minutes if workspace imports, AI planning, or executive dashboards are degraded."
  },
  {
    slug: "customer-ops-playbook",
    title: "Customer ops triage playbook",
    category: "playbook",
    content:
      "Prioritize Sprintlane tickets by launch risk first, then executive visibility. Workspace import failures, permissions leaks, and stale portfolio dashboards outrank cosmetic issues or internal-only tooling defects."
  }
];

export const sampleTickets = [
  {
    externalId: "SUP-104",
    title: "GitHub import stalls for Northwind launch workspace",
    status: "open",
    priority: "high",
    owner: "Maya",
    summary:
      "The customer cannot finish historical issue import, so Sprintlane's AI sprint-plan draft is missing linked PR context before rollout sign-off."
  },
  {
    externalId: "SUP-103",
    title: "Executive dashboard stays stale after Jira board re-sync",
    status: "investigating",
    priority: "critical",
    owner: "Jordan",
    summary:
      "Portfolio summaries are still based on yesterday's Jira snapshot, and leadership reviews are now diverging from the underlying workspace state."
  },
  {
    externalId: "SUP-098",
    title: "Guest collaborators can still view restricted roadmap comments",
    status: "planned",
    priority: "medium",
    owner: "Alex",
    summary:
      "Security wants guest-role visibility tightened before the next enterprise compliance review, but the patch has not been scheduled yet."
  }
];

export const sampleActivities = [
  {
    kind: "deploy",
    title: "Importer worker release 2026.04.1",
    body:
      "Rolled out Jira/GitHub import retry logic and roadmap snapshot instrumentation to production.",
    occurredAt: "2026-04-01T08:15:00Z"
  },
  {
    kind: "incident",
    title: "Portfolio snapshot regeneration lag",
    body:
      "Observed elevated delays refreshing executive dashboards after large Jira syncs completed for enterprise workspaces.",
    occurredAt: "2026-04-01T09:30:00Z"
  },
  {
    kind: "customer",
    title: "Design-partner escalation from Northwind Labs",
    body:
      "Northwind Labs reported rollout risk because the launch workspace still lacks imported GitHub history and AI-generated status summaries.",
    occurredAt: "2026-04-01T10:05:00Z"
  }
];
