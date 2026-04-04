import { createHash } from "node:crypto";

import { z } from "zod";

import { companyContext, profileCatalog, simulationProfiles, type SimulationProfile } from "@/lib/demo";

export type SimulationConfig = {
  profile: SimulationProfile;
  scaleFactor: number;
  durationSeconds: number;
  cadenceSeconds: number;
};

export type GeneratedTicketEvent = {
  eventType: "ticket";
  externalId: string;
  source: string;
  customer: string;
  title: string;
  body: string;
  owner: string;
  status: "open" | "investigating" | "planned";
  priority: "critical" | "high" | "medium" | "low";
  occurredAt: string;
};

export type GeneratedActivityEvent = {
  eventType: "activity";
  externalId: string;
  source: string;
  customer: string;
  title: string;
  body: string;
  kind: "deploy" | "incident" | "customer" | "ops" | "security";
  occurredAt: string;
};

export type GeneratedInboundEvent = GeneratedTicketEvent | GeneratedActivityEvent;

export type TriageClassification = {
  category: "incident" | "customer-risk" | "release" | "billing" | "auth" | "performance" | "compliance" | "general";
  riskScore: number;
  sentiment: "negative" | "neutral" | "positive";
  priority: "critical" | "high" | "medium" | "low";
  tags: string[];
  recommendedAction: string;
  rationale: string;
  searchSummary: string;
};

const DEFAULT_SIMULATION_CONFIG: SimulationConfig = {
  profile: "rollout",
  scaleFactor: 1,
  durationSeconds: 60,
  cadenceSeconds: 4,
};

const ticketPayloadSchema = z.object({
  title: z.string().min(10).max(140),
  body: z.string().min(25).max(420),
  source: z.string().min(3).max(40),
  customer: z.string().min(2).max(80),
  owner: z.string().min(2).max(40),
  status: z.enum(["open", "investigating", "planned"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
});

const activityPayloadSchema = z.object({
  title: z.string().min(8).max(140),
  body: z.string().min(20).max(420),
  source: z.string().min(3).max(40),
  customer: z.string().min(2).max(80),
  kind: z.enum(["deploy", "incident", "customer", "ops", "security"]),
});

const triageSchema = z.object({
  category: z.enum(["incident", "customer-risk", "release", "billing", "auth", "performance", "compliance", "general"]),
  riskScore: z.number().int().min(1).max(100),
  sentiment: z.enum(["negative", "neutral", "positive"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  tags: z.array(z.string().min(2).max(24)).min(2).max(6),
  recommendedAction: z.string().min(12).max(220),
  rationale: z.string().min(16).max(260),
  searchSummary: z.string().min(12).max(280),
});

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: unknown;
    };
  }>;
};

type EmbeddingResponse = {
  data?: Array<{
    embedding?: number[];
  }>;
};

function normalizeBaseUrl(value: string) {
  return value.replace(/\/$/, "");
}

function extractContentText(content: unknown): string | null {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return null;
  }

  const parts = content
    .map((item) => {
      if (typeof item === "string") return item;
      if (typeof item !== "object" || !item) return null;
      if ("text" in item && typeof item.text === "string") return item.text;
      return null;
    })
    .filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join("\n") : null;
}

function parseJsonObject(text: string): unknown {
  const trimmed = text.trim();
  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const candidate = fencedMatch?.[1]?.trim() ?? trimmed;

  try {
    return JSON.parse(candidate);
  } catch {
    const firstBrace = candidate.indexOf("{");
    const lastBrace = candidate.lastIndexOf("}");
    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }
    throw new Error("Invalid JSON payload returned by model");
  }
}

async function runChatJson(systemPrompt: string, userPrompt: string, temperature = 0.2): Promise<unknown | null> {
  const model = process.env.LLM_MODEL;
  const apiKey = process.env.OPENAI_API_KEY ?? "defang";
  const llmBaseUrl = process.env.LLM_BASE_URL;

  if (!model || !llmBaseUrl || process.env.MOCK_AGENT === "true") {
    return null;
  }

  const endpoint = `${normalizeBaseUrl(llmBaseUrl)}/chat/completions`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: 450,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as ChatCompletionResponse;
    const rawText = extractContentText(payload.choices?.[0]?.message?.content);
    if (!rawText) {
      return null;
    }

    return parseJsonObject(rawText);
  } catch {
    return null;
  }
}

function hashEmbedding(text: string, dimensions = 192) {
  const buckets = new Array<number>(dimensions).fill(0);
  const digest = createHash("sha256").update(text).digest();

  for (let index = 0; index < text.length; index += 1) {
    const charCode = text.charCodeAt(index);
    const bucket = (charCode + digest[index % digest.length]) % dimensions;
    const direction = digest[(index * 7) % digest.length] % 2 === 0 ? 1 : -1;
    buckets[bucket] += direction * ((charCode % 13) + 1);
  }

  const magnitude = Math.sqrt(buckets.reduce((sum, value) => sum + value * value, 0)) || 1;
  return buckets.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]) {
  const length = Math.min(a.length, b.length);
  if (length === 0) {
    return -1;
  }

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let index = 0; index < length; index += 1) {
    const valueA = a[index] ?? 0;
    const valueB = b[index] ?? 0;
    dot += valueA * valueB;
    magA += valueA * valueA;
    magB += valueB * valueB;
  }

  if (magA === 0 || magB === 0) {
    return -1;
  }

  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function parseEmbedding(input: unknown): number[] | null {
  if (!Array.isArray(input)) {
    return null;
  }

  const vector = input
    .map((value) => (typeof value === "number" ? value : Number.NaN))
    .filter((value) => Number.isFinite(value));

  return vector.length > 0 ? vector : null;
}

export async function embedTextForSearch(text: string) {
  const apiKey = process.env.OPENAI_API_KEY ?? "defang";
  const model = process.env.EMBEDDING_MODEL;
  const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL;

  if (!model || !embeddingBaseUrl || process.env.MOCK_AGENT === "true") {
    return hashEmbedding(text);
  }

  const endpoint = `${normalizeBaseUrl(embeddingBaseUrl)}/embeddings`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      return hashEmbedding(text);
    }

    const payload = (await response.json()) as EmbeddingResponse;
    const embedding = payload.data?.[0]?.embedding;
    if (!embedding || embedding.length === 0) {
      return hashEmbedding(text);
    }

    return embedding;
  } catch {
    return hashEmbedding(text);
  }
}

function toPriorityFromRisk(riskScore: number): TriageClassification["priority"] {
  if (riskScore >= 85) return "critical";
  if (riskScore >= 70) return "high";
  if (riskScore >= 40) return "medium";
  return "low";
}

function fallbackTags(text: string) {
  const normalized = text.toLowerCase();
  const tags = new Set<string>();

  if (/(auth|sso|login|token|password)/.test(normalized)) tags.add("authentication");
  if (/(checkout|payment|invoice|billing|refund)/.test(normalized)) tags.add("billing");
  if (/(latency|timeout|slow|degrad)/.test(normalized)) tags.add("performance");
  if (/(security|audit|policy|compliance|pci|soc2)/.test(normalized)) tags.add("compliance");
  if (/(deploy|release|rollout|feature flag)/.test(normalized)) tags.add("release");
  if (/(customer|account|tenant|escalation)/.test(normalized)) tags.add("customer-impact");
  if (/(jira|github|slack|import|sync|migration|workspace)/.test(normalized)) tags.add("integration");
  if (/(plan|planning|roadmap|portfolio|executive update)/.test(normalized)) tags.add("planning");
  if (/(permission|guest|role|access)/.test(normalized)) tags.add("permissions");

  if (tags.size === 0) {
    tags.add("general");
    tags.add("triage");
  }

  return Array.from(tags).slice(0, 5);
}

function fallbackCategory(tags: string[]): TriageClassification["category"] {
  if (tags.includes("authentication")) return "auth";
  if (tags.includes("billing")) return "billing";
  if (tags.includes("performance")) return "performance";
  if (tags.includes("compliance")) return "compliance";
  if (tags.includes("release")) return "release";
  if (tags.includes("customer-impact")) return "customer-risk";
  return "general";
}

function heuristicRisk(text: string) {
  const normalized = text.toLowerCase();
  let score = 25;
  if (/(outage|sev1|blocked|cannot|critical|down)/.test(normalized)) score += 45;
  if (/(enterprise|payment|checkout|auth|security)/.test(normalized)) score += 20;
  if (/(degrad|latency|retry|intermittent)/.test(normalized)) score += 10;
  if (/(migration|workspace|jira|github|slack|roadmap|planning)/.test(normalized)) score += 8;
  return Math.min(99, score);
}

function fallbackTriage(event: GeneratedInboundEvent): TriageClassification {
  const fullText = `${event.title} ${event.body}`;
  const tags = fallbackTags(fullText);
  const riskScore = heuristicRisk(fullText);

  return {
    category: fallbackCategory(tags),
    riskScore,
    sentiment: riskScore >= 70 ? "negative" : "neutral",
    priority: toPriorityFromRisk(riskScore),
    tags,
    recommendedAction: `Acknowledge ${event.externalId}, route to ${event.eventType === "ticket" ? event.owner : "on-call ops"}, and post a customer-safe update within 10 minutes.`,
    rationale: "Impact keywords and customer-facing symptoms indicate elevated triage urgency.",
    searchSummary: `${event.title} (${event.source}) affecting ${event.customer}. ${event.body}`,
  };
}

function fallbackTicket(profile: SimulationProfile, externalId: string, occurredAt: string, sequence: number): GeneratedTicketEvent {
  const owners = ["Maya", "Jordan", "Alex", "Riley", "Sam"];
  const scenarios: Record<SimulationProfile, Array<{ title: string; body: string; source: string; customer: string }>> = {
    rollout: [
      {
        title: "GitHub import stalls at 92% for enterprise workspace migration",
        body: "A rollout customer cannot finish historical issue import into Sprintlane. The AI sprint-plan draft is missing linked PR activity, and onboarding is blocked until the import resumes.",
        source: "Linear Escalations",
        customer: "Northwind Labs",
      },
      {
        title: "Slack command is creating duplicate action items in launch workspace",
        body: "Customer-success flagged repeated /sprintlane create-task commands generating duplicates in the shared launch channel. Program managers are losing trust in the AI triage workflow.",
        source: "Intercom",
        customer: "Fabrikam Product",
      },
    ],
    planning: [
      {
        title: "Quarterly plan generator timing out on large portfolio workspaces",
        body: "Several product teams with 200+ active initiatives are waiting more than ten minutes for AI-generated roadmap drafts. Planning meetings are starting without updated materials.",
        source: "Salesforce Service Cloud",
        customer: "Astera Cloud",
      },
      {
        title: "Executive dashboard remains stale after Jira board re-sync",
        body: "The workspace appears healthy, but portfolio summaries are still based on yesterday's Jira snapshot. Leadership reports are now inconsistent across teams.",
        source: "Zendesk",
        customer: "Pioneer Health",
      },
    ],
    compliance: [
      {
        title: "Audit export is missing private task-history events",
        body: "A regulated customer cannot produce a complete activity trail for a compliance review. Missing edit history on roadmap items is blocking sign-off.",
        source: "Freshdesk",
        customer: "Atlas Capital",
      },
      {
        title: "Guest role can still view restricted roadmap comments",
        body: "An enterprise admin reports that external collaborators can see roadmap discussion threads they should not access. Security review is now in progress.",
        source: "ServiceNow",
        customer: "Pioneer Bank",
      },
    ],
  };

  const choice = scenarios[profile][sequence % scenarios[profile].length];
  const priority = sequence % 4 === 0 ? "critical" : sequence % 3 === 0 ? "high" : "medium";

  return {
    eventType: "ticket",
    externalId,
    source: choice.source,
    customer: choice.customer,
    title: choice.title,
    body: choice.body,
    owner: owners[sequence % owners.length],
    status: sequence % 5 === 0 ? "investigating" : "open",
    priority,
    occurredAt,
  };
}

function fallbackActivity(profile: SimulationProfile, externalId: string, occurredAt: string, sequence: number): GeneratedActivityEvent {
  const scenarios: Record<SimulationProfile, Array<{ title: string; body: string; source: string; customer: string; kind: GeneratedActivityEvent["kind"] }>> = {
    rollout: [
      {
        title: "Importer worker release auto-rolled back after error spike",
        body: "Canary monitors detected failed Jira and GitHub import steps in newly onboarded workspaces, so the rollout guardrail restored the previous worker build.",
        source: "GitHub Deployments",
        customer: "Internal",
        kind: "deploy",
      },
      {
        title: "Customer-success escalated onboarding blocker for design partner",
        body: "The assigned CSM asked for an ETA and workaround after a launch workspace stayed in migration mode longer than expected.",
        source: "Customer Success",
        customer: "Northwind Labs",
        kind: "customer",
      },
    ],
    planning: [
      {
        title: "AI planning queue latency crossed the internal SLO",
        body: "Roadmap generation and weekly summary jobs are backing up as more workspaces kick off quarterly planning at once.",
        source: "Datadog",
        customer: "Enterprise planning cohort",
        kind: "ops",
      },
      {
        title: "Portfolio snapshot regeneration fell behind Jira sync volume",
        body: "The portfolio service is refreshing workspace health views more slowly than Jira imports finish, leaving stale executive dashboards in customer reviews.",
        source: "Workflow Metrics",
        customer: "Astera Cloud",
        kind: "incident",
      },
    ],
    compliance: [
      {
        title: "Access review monitor flagged unusual guest-role elevation",
        body: "Permissions telemetry detected a guest account inheriting broader workspace access than policy allows. The security lead requested immediate scoping.",
        source: "Security Hub",
        customer: "Internal",
        kind: "security",
      },
      {
        title: "Data retention check failed for one regulated workspace",
        body: "An automated control found archived task comments retained outside the customer's configured policy window, triggering a compliance escalation.",
        source: "Policy Automation",
        customer: "Atlas Capital",
        kind: "incident",
      },
    ],
  };

  const choice = scenarios[profile][sequence % scenarios[profile].length];

  return {
    eventType: "activity",
    externalId,
    source: choice.source,
    customer: choice.customer,
    title: choice.title,
    body: choice.body,
    kind: choice.kind,
    occurredAt,
  };
}

export function normalizeSimulationConfig(config: Partial<SimulationConfig> | undefined): SimulationConfig {
  const requestedProfile = config?.profile;
  const profile = simulationProfiles.includes(requestedProfile as SimulationProfile)
    ? (requestedProfile as SimulationProfile)
    : DEFAULT_SIMULATION_CONFIG.profile;

  const scaleFactor = Math.max(1, Math.min(5, Math.round(config?.scaleFactor ?? DEFAULT_SIMULATION_CONFIG.scaleFactor)));
  const durationSeconds = Math.max(30, Math.min(300, Math.round(config?.durationSeconds ?? DEFAULT_SIMULATION_CONFIG.durationSeconds)));

  // Higher scale means a faster ingest cadence.
  const computedCadence = Math.max(2, Math.round(6 / Math.max(1, scaleFactor)));

  return {
    profile,
    scaleFactor,
    durationSeconds,
    cadenceSeconds: computedCadence,
  };
}

export function simulationPlan(config: SimulationConfig) {
  const maxEvents = 36;
  const expectedEvents = Math.max(4, Math.min(maxEvents, Math.floor(config.durationSeconds / config.cadenceSeconds)));

  return {
    expectedEvents,
    cadenceSeconds: config.cadenceSeconds,
  };
}

export async function generateInboundEvent(
  config: SimulationConfig,
  sequence: number,
  runId: string,
  occurredAt: string,
): Promise<GeneratedInboundEvent> {
  const eventType: GeneratedInboundEvent["eventType"] = sequence % 4 === 0 ? "activity" : "ticket";
  const numericId = sequence.toString().padStart(4, "0");
  const externalId = eventType === "ticket" ? `SUP-${numericId}-${runId.slice(0, 4)}` : `ACT-${numericId}-${runId.slice(0, 4)}`;

  if (eventType === "ticket") {
    const payload = await runChatJson(
      `You generate realistic inbound escalation tickets for ${companyContext.name}, an AI project management startup. Return valid JSON only.`,
      [
        `Company: ${companyContext.productSummary}`,
        `Profile: ${profileCatalog[config.profile].generationPrompt}`,
        `Simulation sequence: ${sequence}`,
        `Required external ID: ${externalId}`,
        `Occurred at: ${occurredAt}`,
        "Return JSON with exactly these keys:",
        '{"title":"...","body":"...","source":"...","customer":"...","owner":"...","status":"open|investigating|planned","priority":"critical|high|medium|low"}',
        "Make the issue clearly about customer-facing project-management workflows such as imports, planning, dashboards, permissions, or collaboration sync.",
        "Use concrete operational details. No markdown.",
      ].join("\n"),
      0.45,
    );

    const parsed = ticketPayloadSchema.safeParse(payload);
    if (parsed.success) {
      return {
        eventType: "ticket",
        externalId,
        ...parsed.data,
        occurredAt,
      };
    }

    return fallbackTicket(config.profile, externalId, occurredAt, sequence);
  }

  const payload = await runChatJson(
    `You generate realistic operational feed events for ${companyContext.name}, an AI project management startup. Return valid JSON only.`,
    [
      `Company: ${companyContext.productSummary}`,
      `Profile: ${profileCatalog[config.profile].generationPrompt}`,
      `Simulation sequence: ${sequence}`,
      `Required external ID: ${externalId}`,
      `Occurred at: ${occurredAt}`,
      "Return JSON with exactly these keys:",
      '{"title":"...","body":"...","source":"...","customer":"...","kind":"deploy|incident|customer|ops|security"}',
      "Make the event clearly about project-management infrastructure, workspace health, integrations, customer success, or security posture.",
      "Use concrete operational details. No markdown.",
    ].join("\n"),
    0.45,
  );

  const parsed = activityPayloadSchema.safeParse(payload);
  if (parsed.success) {
    return {
      eventType: "activity",
      externalId,
      ...parsed.data,
      occurredAt,
    };
  }

  return fallbackActivity(config.profile, externalId, occurredAt, sequence);
}

export async function triageInboundEvent(event: GeneratedInboundEvent): Promise<TriageClassification> {
  const payload = await runChatJson(
    `You are the customer-operations triage model for ${companyContext.name}. Classify inbound escalations for an AI project management product and produce structured outputs. Return valid JSON only.`,
    [
      "Analyze the inbound item and return this exact JSON schema:",
      '{"category":"incident|customer-risk|release|billing|auth|performance|compliance|general","riskScore":1,"sentiment":"negative|neutral|positive","priority":"critical|high|medium|low","tags":["tag"],"recommendedAction":"...","rationale":"...","searchSummary":"..."}',
      "Risk score should represent urgency and customer impact from 1-100.",
      "Tags should be terse and searchable (2-6 tags).",
      "No markdown, no extra keys.",
      `Input type: ${event.eventType}`,
      `Title: ${event.title}`,
      `Body: ${event.body}`,
      `Source: ${event.source}`,
      `Customer: ${event.customer}`,
      event.eventType === "ticket" ? `Status: ${event.status}; Priority: ${event.priority}; Owner: ${event.owner}` : `Kind: ${event.kind}`,
    ].join("\n"),
    0.2,
  );

  const parsed = triageSchema.safeParse(payload);
  if (parsed.success) {
    const cleanedTags = Array.from(
      new Set(
        parsed.data.tags
          .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
          .filter((tag) => tag.length >= 2),
      ),
    ).slice(0, 6);

    return {
      ...parsed.data,
      tags: cleanedTags.length > 0 ? cleanedTags : ["triage", "general"],
    };
  }

  return fallbackTriage(event);
}

export function triageTextForEmbedding(event: GeneratedInboundEvent, triage: TriageClassification) {
  return [
    `${event.externalId} (${event.eventType})`,
    event.title,
    event.body,
    `category:${triage.category}`,
    `priority:${triage.priority}`,
    `risk:${triage.riskScore}`,
    `tags:${triage.tags.join(",")}`,
    triage.searchSummary,
  ].join("\n");
}
