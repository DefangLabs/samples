export const companyContext = {
  name: "Sprintlane",
  commandCenterName: "Sprintlane Live Ops",
  productSummary:
    "Sprintlane is an AI-powered project management platform that syncs Jira, GitHub, Slack, and docs to generate plans, status updates, and delivery risk alerts for software teams.",
  useCaseSummary:
    "This demo shows tasks and events flowing in from multiple tools, being classified automatically, and then used by a copilot to answer questions about what needs attention.",
} as const;

export const simulationProfiles = ["rollout", "planning", "compliance"] as const;

export type SimulationProfile = (typeof simulationProfiles)[number];

export const profileCatalog: Record<
  SimulationProfile,
  {
    label: string;
    shortSummary: string;
    generationPrompt: string;
  }
> = {
  rollout: {
    label: "Enterprise Rollout",
    shortSummary: "New customer workspaces are onboarding and importing project data from Jira, GitHub, and Slack.",
    generationPrompt:
      "Sprintlane enterprise rollout week. Customers are onboarding new project-management workspaces, migrating historical Jira/GitHub/Slack data, and relying on AI-generated sprint plans and executive updates.",
  },
  planning: {
    label: "Planning Week",
    shortSummary:
      "Quarterly planning creates bursts of AI plan generation, portfolio dashboard refreshes, and collaboration sync traffic.",
    generationPrompt:
      "Sprintlane quarterly planning week. Product and engineering teams are generating roadmap drafts, weekly updates, and portfolio summaries from large Jira/GitHub datasets, causing heavy sync and inference traffic.",
  },
  compliance: {
    label: "Compliance Review",
    shortSummary: "Enterprise customers are reviewing permissions, audit exports, data retention, and workspace isolation.",
    generationPrompt:
      "Sprintlane compliance review week. Enterprise customers are validating audit logs, guest permissions, data residency controls, and retention settings for regulated project-management workspaces.",
  },
};

export function getProfileLabel(profile: string | null | undefined) {
  if (!profile) return "profile";
  if (profile in profileCatalog) {
    return profileCatalog[profile as SimulationProfile].label;
  }
  return profile;
}
