import { createHash } from "node:crypto";

import { generateText } from "ai";
import { z } from "zod";

import type { ItemClassification, ItemType, RawItemSeed } from "@/lib/items";
import { getDirectBedrockModel, isAwsBedrockRuntime } from "@/lib/model";

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

const taskSchema = z.object({
  source: z.string().min(2).max(40),
  title: z.string().min(8).max(120),
  body: z.string().min(20).max(320),
  status: z.enum(["open", "in progress", "blocked", "planned"]),
  assignee: z.string().min(2).max(40),
});

const eventSchema = z.object({
  source: z.string().min(2).max(40),
  title: z.string().min(8).max(120),
  body: z.string().min(20).max(320),
});

const taskBatchSchema = z.object({
  tasks: z.array(taskSchema).length(10),
});

const eventBatchSchema = z.object({
  events: z.array(eventSchema).length(10),
});

const classificationSchema = z.object({
  category: z.string().min(2).max(40),
  priority: z.enum(["low", "medium", "high", "critical"]),
  tags: z.array(z.string().min(2).max(24)).min(2).max(4),
});

const fallbackTasks: RawItemSeed[] = [
  {
    itemType: "task",
    source: "Jira",
    title: "Billing page retry banner does not appear after a failed card check",
    body: "Support reproduced a failed subscription checkout where the retry path works but the UI never confirms it. The product team wants this fixed before the next release cut.",
    status: "open",
    assignee: "Maya",
  },
  {
    itemType: "task",
    source: "Linear",
    title: "Fix duplicate project creation when the import wizard retries",
    body: "Two customers reported seeing duplicate projects after retrying the CSV import. Engineering already has traces, but the task still needs a proper fix and rollout note.",
    status: "blocked",
    assignee: "Jordan",
  },
  {
    itemType: "task",
    source: "GitHub",
    title: "Finish the API pagination patch for the activity feed endpoint",
    body: "The current activity feed stops at 50 records, which makes the timeline feel incomplete for active workspaces. The patch is half done and still needs tests.",
    status: "in progress",
    assignee: "Riley",
  },
  {
    itemType: "task",
    source: "Jira",
    title: "Investigate why roadmap comments load slowly on large accounts",
    body: "Performance traces show slow comment hydration on accounts with thousands of archived tasks. The team needs a clear root cause and a smaller reproduction case.",
    status: "open",
    assignee: "Sam",
  },
  {
    itemType: "task",
    source: "Linear",
    title: "Add a customer-facing status note for delayed Slack syncs",
    body: "Slack sync delays now take several minutes to clear, but the product gives no feedback. Product wants a lightweight status note until the backend issue is fixed.",
    status: "planned",
    assignee: "Alex",
  },
  {
    itemType: "task",
    source: "GitHub",
    title: "Write the migration script for stale automation rules",
    body: "A schema change left some automation rules in an older format. The migration needs to be safe to rerun and easy to validate in staging.",
    status: "open",
    assignee: "Maya",
  },
  {
    itemType: "task",
    source: "Jira",
    title: "Review the failed deploy checklist for last night’s rollback",
    body: "Operations wants a concise follow-up task list after the rollback. The checklist should point to the real gaps rather than repeating alert text.",
    status: "in progress",
    assignee: "Jordan",
  },
  {
    itemType: "task",
    source: "Linear",
    title: "Update the onboarding flow copy for missing calendar permissions",
    body: "Users who skip calendar permissions get stuck in setup with no useful explanation. Design already proposed simpler copy and wants it shipped quickly.",
    status: "open",
    assignee: "Riley",
  },
  {
    itemType: "task",
    source: "GitHub",
    title: "Repair the flaky notification worker test before the next release",
    body: "The notification worker integration test fails randomly in CI and blocks merges. Engineering wants a proper fix rather than another retry wrapper.",
    status: "blocked",
    assignee: "Sam",
  },
  {
    itemType: "task",
    source: "Jira",
    title: "Verify the invoice export patch against a multi-currency account",
    body: "Finance requested one last verification pass before they tell customers the invoice export issue is fixed. The edge case is a workspace with mixed USD and EUR invoices.",
    status: "planned",
    assignee: "Alex",
  },
];

const fallbackEvents: RawItemSeed[] = [
  {
    itemType: "event",
    source: "Datadog",
    title: "API latency crossed the warning threshold for project reads",
    body: "Read requests for the projects API stayed above the warning threshold for six minutes after traffic spiked in Europe.",
  },
  {
    itemType: "event",
    source: "Vercel",
    title: "Frontend deploy rolled back after elevated client errors",
    body: "The latest frontend release was automatically rolled back when client-side error rates doubled during the canary window.",
  },
  {
    itemType: "event",
    source: "Sentry",
    title: "Task details page started throwing undefined owner errors",
    body: "A new server-side exception appeared on the task details page and is affecting a small but growing percentage of sessions.",
  },
  {
    itemType: "event",
    source: "GitHub Actions",
    title: "Release workflow failed on the database migration step",
    body: "The nightly release workflow reached the migration stage and failed before the application images were promoted.",
  },
  {
    itemType: "event",
    source: "Slack",
    title: "Customer support channel flagged another duplicate import report",
    body: "A support lead posted a fresh duplicate import report with screenshots and linked it to the existing engineering investigation.",
  },
  {
    itemType: "event",
    source: "PagerDuty",
    title: "On-call incident opened for delayed webhook delivery",
    body: "The webhook delivery worker started falling behind and crossed the paging threshold for the first time this week.",
  },
  {
    itemType: "event",
    source: "Stripe",
    title: "Subscription update webhooks arrived out of order for one tenant",
    body: "Billing logs show a small batch of out-of-order subscription events, which may explain mismatched plan state in the app.",
  },
  {
    itemType: "event",
    source: "CloudWatch",
    title: "Worker memory climbed steadily during the hourly sync job",
    body: "The background worker used more memory than usual during the sync cycle, then recovered after the queue drained.",
  },
  {
    itemType: "event",
    source: "Statuspage",
    title: "A short-lived degradation notice was posted for search responses",
    body: "Search responses slowed down for a few minutes, enough for the team to post a degraded-performance notice before recovery.",
  },
  {
    itemType: "event",
    source: "Linear",
    title: "Product team linked today’s rollout issue to an existing backend bug",
    body: "A product manager connected the latest customer report to a backend issue that has been open since last week, giving engineering a likely root cause.",
  },
];

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
    const firstBracket = candidate.indexOf("[");
    const lastBracket = candidate.lastIndexOf("]");

    if (firstBrace >= 0 && lastBrace > firstBrace) {
      return JSON.parse(candidate.slice(firstBrace, lastBrace + 1));
    }

    if (firstBracket >= 0 && lastBracket > firstBracket) {
      return JSON.parse(candidate.slice(firstBracket, lastBracket + 1));
    }

    throw new Error("Invalid JSON payload returned by model");
  }
}

async function runChatJson(systemPrompt: string, userPrompt: string, temperature = 0.4) {
  const model = process.env.LLM_MODEL;
  const apiKey = process.env.OPENAI_API_KEY ?? "defang";
  const llmBaseUrl = process.env.LLM_BASE_URL;

  if (!model || process.env.MOCK_AGENT === "true") {
    return null;
  }

  if (isAwsBedrockRuntime()) {
    const { text } = await generateText({
      model: getDirectBedrockModel(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature,
    });

    return parseJsonObject(text);
  }

  if (!llmBaseUrl) {
    return null;
  }

  const response = await fetch(`${normalizeBaseUrl(llmBaseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM request failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  const rawText = extractContentText(payload.choices?.[0]?.message?.content);
  if (!rawText) {
    throw new Error("LLM returned no content");
  }

  return parseJsonObject(rawText);
}

async function runChatText(systemPrompt: string, userPrompt: string, temperature = 0.2) {
  const model = process.env.LLM_MODEL;
  const apiKey = process.env.OPENAI_API_KEY ?? "defang";
  const llmBaseUrl = process.env.LLM_BASE_URL;

  if (!model || process.env.MOCK_AGENT === "true") {
    return null;
  }

  if (isAwsBedrockRuntime()) {
    const { text } = await generateText({
      model: getDirectBedrockModel(model),
      system: systemPrompt,
      prompt: userPrompt,
      temperature,
    });

    return text;
  }

  if (!llmBaseUrl) {
    return null;
  }

  const response = await fetch(`${normalizeBaseUrl(llmBaseUrl)}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LLM text request failed: ${response.status} ${text}`);
  }

  const payload = (await response.json()) as ChatCompletionResponse;
  return extractContentText(payload.choices?.[0]?.message?.content);
}

function fallbackCategory(text: string) {
  const normalized = text.toLowerCase();

  if (/(deploy|release|workflow|rollback)/.test(normalized)) return "delivery";
  if (/(payment|invoice|billing|subscription)/.test(normalized)) return "billing";
  if (/(latency|timeout|slow|memory|performance)/.test(normalized)) return "performance";
  if (/(import|sync|webhook|integration|duplicate)/.test(normalized)) return "integration";
  if (/(error|exception|incident|alert)/.test(normalized)) return "incident";
  return "operations";
}

function fallbackPriority(text: string) {
  const normalized = text.toLowerCase();
  if (/(critical|rollback|paged|blocked|failing|out of order)/.test(normalized)) return "critical";
  if (/(error|duplicate|latency|failed|degraded)/.test(normalized)) return "high";
  if (/(planned|review|verify|update)/.test(normalized)) return "medium";
  return "low";
}

function fallbackTags(text: string) {
  const normalized = text.toLowerCase();
  const tags = new Set<string>();

  if (/(api|latency|timeout|performance|memory)/.test(normalized)) tags.add("performance");
  if (/(deploy|release|workflow|rollback)/.test(normalized)) tags.add("delivery");
  if (/(payment|invoice|billing|subscription)/.test(normalized)) tags.add("billing");
  if (/(import|sync|webhook|integration)/.test(normalized)) tags.add("integration");
  if (/(customer|support|report)/.test(normalized)) tags.add("customer");
  if (/(bug|error|exception|incident|alert)/.test(normalized)) tags.add("incident");

  if (tags.size < 2) {
    tags.add("ops");
    tags.add("triage");
  }

  return Array.from(tags).slice(0, 4);
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
  const model = process.env.EMBEDDING_MODEL ?? "default";
  const embeddingBaseUrl = process.env.EMBEDDING_BASE_URL;

  if (!embeddingBaseUrl || process.env.MOCK_AGENT === "true") {
    return hashEmbedding(text);
  }

  try {
    const response = await fetch(`${normalizeBaseUrl(embeddingBaseUrl)}/embeddings`, {
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

function toRawItems(type: ItemType, rows: Array<z.infer<typeof taskSchema> | z.infer<typeof eventSchema>>): RawItemSeed[] {
  return rows.map((row) => ({
    itemType: type,
    source: row.source,
    title: row.title,
    body: row.body,
    status: "status" in row ? row.status : null,
    assignee: "assignee" in row ? row.assignee : null,
  }));
}

async function generateTasksWithLlm() {
  const payload = await runChatJson(
    "You generate realistic project-team task records. Return valid JSON only.",
    [
      "Generate exactly 10 task records for a software product team.",
      "These tasks should look like assigned work pulled from tools like Jira, Linear, and GitHub.",
      "Avoid fake enterprise jargon. Keep them concrete and easy to understand.",
      "Return this exact shape:",
      '{"tasks":[{"source":"Jira","title":"...","body":"...","status":"open|in progress|blocked|planned","assignee":"..."}]}',
      "Do not include markdown.",
    ].join("\n"),
    0.8,
  );

  return taskBatchSchema.parse(payload).tasks;
}

async function generateEventsWithLlm() {
  const payload = await runChatJson(
    "You generate realistic system event records. Return valid JSON only.",
    [
      "Generate exactly 10 event records for a software product team.",
      "These events should look like recent activity from tools like Datadog, Vercel, Sentry, Slack, GitHub Actions, Stripe, and PagerDuty.",
      "Avoid fake enterprise jargon. Keep them concrete and easy to understand.",
      "Return this exact shape:",
      '{"events":[{"source":"Datadog","title":"...","body":"..."}]}',
      "Do not include markdown.",
    ].join("\n"),
    0.8,
  );

  return eventBatchSchema.parse(payload).events;
}

export async function generateSeedItems(): Promise<RawItemSeed[]> {
  const hasLlm = Boolean(process.env.LLM_MODEL && (isAwsBedrockRuntime() || process.env.LLM_BASE_URL));

  if (!hasLlm || process.env.MOCK_AGENT === "true") {
    return [...fallbackTasks, ...fallbackEvents];
  }

  const [tasks, events] = await Promise.all([generateTasksWithLlm(), generateEventsWithLlm()]);
  return [...toRawItems("task", tasks), ...toRawItems("event", events)];
}

export async function classifyItem(item: Pick<RawItemSeed, "itemType" | "source" | "title" | "body">): Promise<ItemClassification> {
  const hasLlm = Boolean(process.env.LLM_MODEL && (isAwsBedrockRuntime() || process.env.LLM_BASE_URL));

  if (!hasLlm || process.env.MOCK_AGENT === "true") {
    const text = `${item.source} ${item.title} ${item.body}`;
    return {
      category: fallbackCategory(text),
      priority: fallbackPriority(text),
      tags: fallbackTags(text),
    };
  }

  const payload = await runChatJson(
    "You classify incoming tasks and system events. Return valid JSON only.",
    [
      `Item type: ${item.itemType}`,
      `Source: ${item.source}`,
      `Title: ${item.title}`,
      `Body: ${item.body}`,
      "Return this exact shape:",
      '{"category":"...","priority":"low|medium|high|critical","tags":["tag-one","tag-two"]}',
      "Keep category short and practical, like incident, delivery, billing, performance, integration, or support.",
      "Return 2 to 4 tags.",
      "Do not include markdown.",
    ].join("\n"),
    0.2,
  );

  return classificationSchema.parse(payload);
}

export function textForEmbedding(item: Pick<RawItemSeed, "itemType" | "source" | "title" | "body">, classification: ItemClassification) {
  return [
    item.itemType,
    item.source,
    item.title,
    item.body,
    classification.category,
    classification.priority,
    classification.tags.join(" "),
  ].join("\n");
}

export async function answerQuestionWithContext(question: string, context: string) {
  return runChatText(
    [
      "You are the copilot for a demo app that tracks tasks and events.",
      "Answer using the provided context only.",
      "Be concise and concrete.",
      "If the requested item is not present in the context, say that directly.",
      "When relevant, mention status, owner, source, priority, category, and tags.",
      "Use markdown bullet points only when they improve clarity.",
    ].join("\n"),
    [`Question: ${question}`, "", "Current context:", context].join("\n"),
    0.2,
  );
}
