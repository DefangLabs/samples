import { createHash } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { embed } from "ai";
import { z } from "zod";

import type { ItemClassification, ItemType, RawItemSeed } from "@/lib/items";
import { getMastraEmbeddingModel, hasChatAccess, hasEmbeddingAccess } from "@/lib/model";
import { fallbackEvents, fallbackTasks } from "@/lib/seed-data";
import { mastra } from "@/mastra";

// ---------------------------------------------------------------------------
// 429-aware retry
//
// LLM/embedding endpoints (especially Azure OpenAI) frequently throttle.
// We retry on 429 / "rate limit" / "Too Many Requests" with exponential
// backoff + jitter. If the server provides a `Retry-After` header we honor
// it; otherwise we double the delay each attempt.
// ---------------------------------------------------------------------------

const RETRY_MAX_ATTEMPTS = Number(process.env.LLM_RETRY_MAX_ATTEMPTS ?? 6);
const RETRY_BASE_DELAY_MS = Number(process.env.LLM_RETRY_BASE_DELAY_MS ?? 1500);
const RETRY_MAX_DELAY_MS = Number(process.env.LLM_RETRY_MAX_DELAY_MS ?? 30_000);

function getErrorStatus(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const obj = error as Record<string, unknown>;
  if (typeof obj.status === "number") return obj.status;
  if (typeof obj.statusCode === "number") return obj.statusCode;
  const response = obj.response as Record<string, unknown> | undefined;
  if (response && typeof response.status === "number") return response.status;
  return null;
}

export function getRetryAfterMs(error: unknown): number | null {
  if (typeof error !== "object" || error === null) return null;
  const obj = error as Record<string, unknown>;
  const headers =
    (obj.responseHeaders as Record<string, unknown> | undefined) ??
    ((obj.response as Record<string, unknown> | undefined)?.headers as Record<string, unknown> | undefined);
  if (!headers) return null;

  // Azure sends retry-after-ms (precise, often <1s) alongside retry-after
  // (RFC seconds, typically the next quota window). Prefer the precise one.
  const rawMs = headers["retry-after-ms"] ?? headers["Retry-After-Ms"];
  if (typeof rawMs === "string" || typeof rawMs === "number") {
    const ms = Number(String(rawMs).trim());
    if (Number.isFinite(ms)) return ms;
  }

  const raw = headers["retry-after"] ?? headers["Retry-After"];
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const value = String(raw).trim();
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds * 1000;
  const dateMs = Date.parse(value);
  if (Number.isFinite(dateMs)) return Math.max(0, dateMs - Date.now());
  return null;
}

export function isRateLimitError(error: unknown) {
  if (getErrorStatus(error) === 429) return true;
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /rate.?limit|too many requests|429/i.test(message);
}

async function withRateLimitRetry<T>(label: string, run: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= RETRY_MAX_ATTEMPTS; attempt += 1) {
    try {
      return await run();
    } catch (error) {
      lastError = error;
      if (!isRateLimitError(error) || attempt === RETRY_MAX_ATTEMPTS) throw error;

      const retryAfterMs = getRetryAfterMs(error);
      const backoffMs = Math.min(RETRY_MAX_DELAY_MS, RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      const jitter = Math.floor(Math.random() * Math.min(500, backoffMs / 2));
      const delay = (retryAfterMs ?? backoffMs) + jitter;
      console.warn(`[${label}] rate limited (attempt ${attempt}/${RETRY_MAX_ATTEMPTS}), retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

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

const taskBatchSchema = z.object({ tasks: z.array(taskSchema).length(5) });
const eventBatchSchema = z.object({ events: z.array(eventSchema).length(5) });

const classificationSchema = z.object({
  category: z.string().min(2).max(40),
  priority: z.enum(["low", "medium", "high", "critical"]),
  tags: z.array(z.string().min(2).max(24)).min(2).max(4),
});

// ---------------------------------------------------------------------------
// LLM communication
// ---------------------------------------------------------------------------

/** Extracts JSON from LLM output, handling markdown fences and extra text. */
function parseJsonFromText(text: string): unknown {
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

function hasLlmAccess() {
  return hasChatAccess();
}

function useFastLocalData() {
  return process.env.LOCAL_FAST_DATA === "true";
}

async function runChat(
  systemPrompt: string,
  userPrompt: string,
  _temperature: number,
  parseResponse: (text: string) => unknown,
) {
  if (!hasLlmAccess() || process.env.MOCK_AGENT === "true") return null;

  const agent = mastra.getAgent("generatorAgent");
  const prompt = `${systemPrompt}\n\n${userPrompt}`;
  const result = await withRateLimitRetry("chat", () => agent.generate(prompt, { maxSteps: 1 }));

  return parseResponse(result.text ?? "");
}

async function runChatJson(systemPrompt: string, userPrompt: string, temperature = 0.4) {
  return runChat(systemPrompt, userPrompt, temperature, parseJsonFromText);
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

/** Generates a stable fake embedding from text using SHA-256. Used in mock mode to enable vector search without an API call. */
function deterministicEmbedding(text: string, dimensions = 192) {
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

export async function embedTextForSearch(text: string) {
  if (process.env.MOCK_AGENT === "true" || !hasEmbeddingAccess()) {
    return deterministicEmbedding(text);
  }

  try {
    const model = getMastraEmbeddingModel();
    const result = await withRateLimitRetry("embed", () => embed({ model, value: text }));
    return result.embedding;
  } catch {
    return deterministicEmbedding(text);
  }
}

// ---------------------------------------------------------------------------
// Classification (with regex fallbacks)
// ---------------------------------------------------------------------------

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

export async function classifyItem(item: Pick<RawItemSeed, "itemType" | "source" | "title" | "body">): Promise<ItemClassification> {
  if (useFastLocalData() || !hasLlmAccess() || process.env.MOCK_AGENT === "true") {
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

// ---------------------------------------------------------------------------
// Seed item generation
// ---------------------------------------------------------------------------

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
      "Generate exactly 5 task records for a software product team.",
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
      "Generate exactly 5 event records for a software product team.",
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
  if (useFastLocalData() || !hasLlmAccess() || process.env.MOCK_AGENT === "true") {
    return [...fallbackTasks.slice(0, 5), ...fallbackEvents.slice(0, 5)];
  }

  // Serialized — running these in parallel bursts two requests at once and
  // immediately competes with the per-item classify jobs for the same quota.
  const tasks = await generateTasksWithLlm();
  const events = await generateEventsWithLlm();
  return [...toRawItems("task", tasks), ...toRawItems("event", events)];
}

// ---------------------------------------------------------------------------
// Embedding text builder
// ---------------------------------------------------------------------------

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
