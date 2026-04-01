export const sampleDocuments = [
  {
    slug: "launch-readiness",
    title: "Launch readiness checklist",
    category: "runbook",
    content:
      "Before launch, confirm billing webhooks, verify Postgres backups, and validate that support escalation routing sends Sev1 incidents to the on-call engineer within five minutes."
  },
  {
    slug: "incident-handling",
    title: "Incident handling guide",
    category: "runbook",
    content:
      "Sev1 incidents require an incident commander, status updates every fifteen minutes, and a rollback decision within thirty minutes if customer checkout or authentication is degraded."
  },
  {
    slug: "support-playbook",
    title: "Support triage playbook",
    category: "playbook",
    content:
      "Prioritize tickets by customer impact first, then by revenue risk. Authentication, billing, and data integrity issues outrank cosmetic bugs or internal tooling requests."
  }
];

export const sampleTickets = [
  {
    externalId: "SUP-104",
    title: "Checkout confirmation emails delayed for EU customers",
    status: "open",
    priority: "high",
    owner: "Maya",
    summary:
      "Webhook retries are backing up when the mail provider rate-limits burst traffic after release deploys."
  },
  {
    externalId: "SUP-103",
    title: "Admin dashboard intermittently fails after SSO login",
    status: "investigating",
    priority: "critical",
    owner: "Jordan",
    summary:
      "SSO callback sessions are expiring too early, causing account owners to retry login loops during incident reviews."
  },
  {
    externalId: "SUP-098",
    title: "Feature flag cleanup for archived tenants",
    status: "planned",
    priority: "medium",
    owner: "Alex",
    summary:
      "Stale launch flags should be removed before the next release train to keep rollout rules understandable."
  }
];

export const sampleActivities = [
  {
    kind: "deploy",
    title: "API release 2026.04.1",
    body:
      "Rolled out checkout retry logic and dashboard latency instrumentation to production.",
    occurredAt: "2026-04-01T08:15:00Z"
  },
  {
    kind: "incident",
    title: "SSO callback degradation",
    body:
      "Observed elevated authentication retries for enterprise tenants after the identity provider metadata refresh.",
    occurredAt: "2026-04-01T09:30:00Z"
  },
  {
    kind: "customer",
    title: "Top account escalation from Northwind",
    body:
      "Northwind reported delayed order confirmations impacting customer support throughput.",
    occurredAt: "2026-04-01T10:05:00Z"
  }
];
