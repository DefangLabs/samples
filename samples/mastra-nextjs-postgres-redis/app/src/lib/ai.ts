import { createHash } from "node:crypto";

import { embed, generateText } from "ai";
import { z } from "zod";

import type { ItemClassification, ItemType, RawItemSeed } from "@/lib/items";
import { getMastraEmbeddingModel, getMastraModel } from "@/lib/model";
import { fallbackEvents, fallbackTasks } from "@/lib/seed-data";

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

const taskBatchSchema = z.object({ tasks: z.array(taskSchema).length(10) });
const eventBatchSchema = z.object({ events: z.array(eventSchema).length(10) });

const classificationSchema = z.object({
  category: z.string().min(2).max(40),
  priority: z.enum(["low", "medium", "high", "critical"]),
  tags: z.array(z.string().min(2).max(24)).min(2).max(4),
});

// ---------------------------------------------------------------------------
// LLM communication
// ---------------------------------------------------------------------------

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
  return Boolean(process.env.LLM_MODEL);
}

async function runChat(
  systemPrompt: string,
  userPrompt: string,
  temperature: number,
  parseResponse: (text: string) => unknown,
) {
  if (!hasLlmAccess() || process.env.MOCK_AGENT === "true") return null;

  const { text } = await generateText({
    // getMastraModel() returns a native AI SDK model for bedrock,
    // or an OpenAICompatibleConfig for other providers (resolved by Mastra agent).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    model: getMastraModel() as any,
    system: systemPrompt,
    prompt: userPrompt,
    temperature,
  });

  return parseResponse(text);
}

async function runChatJson(systemPrompt: string, userPrompt: string, temperature = 0.4) {
  return runChat(systemPrompt, userPrompt, temperature, parseJsonFromText);
}

async function runChatText(systemPrompt: string, userPrompt: string, temperature = 0.2) {
  return runChat(systemPrompt, userPrompt, temperature, (text) => text);
}

// ---------------------------------------------------------------------------
// Embeddings
// ---------------------------------------------------------------------------

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
  if (process.env.MOCK_AGENT === "true") {
    return deterministicEmbedding(text);
  }

  try {
    const model = getMastraEmbeddingModel();
    const result = await embed({ model, value: text });
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
  if (!hasLlmAccess() || process.env.MOCK_AGENT === "true") {
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
  if (!hasLlmAccess() || process.env.MOCK_AGENT === "true") {
    return [...fallbackTasks, ...fallbackEvents];
  }

  const [tasks, events] = await Promise.all([generateTasksWithLlm(), generateEventsWithLlm()]);
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

// ---------------------------------------------------------------------------
// Context-aware Q&A
// ---------------------------------------------------------------------------

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
