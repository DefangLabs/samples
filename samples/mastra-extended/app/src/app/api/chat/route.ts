/**
 * POST /api/chat — Copilot endpoint.
 *
 * Accepts a user message and returns either a streaming (NDJSON) or
 * non-streaming JSON response from the Mastra agent. The agent uses tools
 * (getTasks, getEvents, getTags, searchItems) to inspect app state before
 * answering. When MOCK_AGENT is enabled or the agent fails, responses fall
 * back to a lightweight mock that queries the database directly.
 */

import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { NextRequest, NextResponse } from "next/server";

import type { ChatStreamEvent } from "@/app/types";
import { ensureSchema } from "@/lib/db";
import { getMockReply } from "@/lib/mock-agent";
import { mastra } from "@/mastra";

export const runtime = "nodejs";

// ---------------------------------------------------------------------------
// Request parsing
// ---------------------------------------------------------------------------

interface ChatRequest {
  message: string;
  threadId: string;
  stream: boolean;
}

function parseChatRequest(payload: unknown): ChatRequest | null {
  if (typeof payload !== "object" || !payload) return null;
  const obj = payload as Record<string, unknown>;
  const message = typeof obj.message === "string" ? obj.message : null;
  if (!message) return null;

  return {
    message,
    threadId: typeof obj.threadId === "string" ? obj.threadId : randomUUID(),
    stream: obj.stream === true,
  };
}

// ---------------------------------------------------------------------------
// Agent helpers
// ---------------------------------------------------------------------------

const agentOptions = (threadId: string) => ({
  resourceId: "tasks-and-events" as const,
  threadId,
  maxSteps: 15,
  toolChoice: (process.env.LLM_DISABLE_TOOLS === "true" ? "none" : "auto") as "none" | "auto",
});

/** Streams agent output. v1 models return plain text; v2+ return structured chunks with tool calls. */
async function callAgentStream(message: string, threadId: string) {
  const agent = mastra.getAgent("opsAgent");
  const model = await agent.getModel();
  const options = agentOptions(threadId);

  const isLegacy = model.specificationVersion === "v1";
  const response = isLegacy
    ? await agent.streamLegacy(message, options)
    : await agent.stream(message, options);

  return {
    stream: isLegacy ? response.textStream : response.fullStream,
    streamKind: isLegacy ? ("text" as const) : ("full" as const),
  };
}

async function callAgentGenerate(message: string, threadId: string) {
  const agent = mastra.getAgent("opsAgent");
  const model = await agent.getModel();
  const options = agentOptions(threadId);

  return model.specificationVersion === "v1"
    ? agent.generateLegacy(message, options)
    : agent.generate(message, options);
}

// ---------------------------------------------------------------------------
// Stream iteration helpers
// ---------------------------------------------------------------------------

function isReadableStream(value: unknown): value is ReadableStream<unknown> {
  return typeof value === "object" && value !== null && "getReader" in value;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value;
}

async function* iterateTextStream(source: unknown): AsyncGenerator<string> {
  if (!source) return;

  if (isReadableStream(source)) {
    const reader = source.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (typeof value === "string") yield value;
        else if (value instanceof Uint8Array) yield new TextDecoder().decode(value);
      }
    } finally {
      reader.releaseLock();
    }
    return;
  }

  if (isAsyncIterable(source)) {
    for await (const chunk of source) {
      if (typeof chunk === "string") yield chunk;
    }
  }
}

async function* iterateStructuredStream(source: unknown): AsyncGenerator<unknown> {
  if (!source) return;

  if (isReadableStream(source)) {
    const reader = source.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield value;
      }
    } finally {
      reader.releaseLock();
    }
    return;
  }

  if (isAsyncIterable(source)) {
    for await (const chunk of source) {
      yield chunk;
    }
  }
}

// ---------------------------------------------------------------------------
// Thinking-tag splitter (stateful across streamed chunks)
//
// Some models emit internal reasoning inside <thinking>...</thinking> tags.
// This stateful parser strips those tags from the text stream so only the
// user-visible reply is forwarded to the client. The structured stream path
// handles reasoning via dedicated "reasoning-delta" chunks instead.
// ---------------------------------------------------------------------------

function createThinkingTextSplitter() {
  const openingTag = "<thinking>";
  const closingTag = "</thinking>";
  let pending = "";
  let insideThinking = false;

  function* feed(chunk: string): Generator<{ type: "delta" | "thinking"; text: string }> {
    pending += chunk.replace(/<thinking>/gi, openingTag).replace(/<\/thinking>/gi, closingTag);

    while (pending.length > 0) {
      if (insideThinking) {
        const closingIndex = pending.indexOf(closingTag);
        if (closingIndex === -1) {
          pending = pending.slice(Math.max(0, pending.length - (closingTag.length - 1)));
          break;
        }
        pending = pending.slice(closingIndex + closingTag.length);
        insideThinking = false;
        continue;
      }

      const openingIndex = pending.indexOf(openingTag);
      if (openingIndex === -1) {
        const safeLength = Math.max(0, pending.length - (openingTag.length - 1));
        if (safeLength > 0) {
          yield { type: "delta", text: pending.slice(0, safeLength) };
          pending = pending.slice(safeLength);
        }
        break;
      }

      if (openingIndex > 0) {
        yield { type: "delta", text: pending.slice(0, openingIndex) };
      }
      pending = pending.slice(openingIndex + openingTag.length);
      insideThinking = true;
    }
  }

  function* flush(): Generator<{ type: "delta" | "thinking"; text: string }> {
    if (pending.length === 0) return;
    yield { type: insideThinking ? "thinking" : "delta", text: pending };
    pending = "";
    insideThinking = false;
  }

  return { feed, flush };
}

// ---------------------------------------------------------------------------
// Chunk inspection helpers
// ---------------------------------------------------------------------------

function getChunkType(chunk: unknown) {
  if (typeof chunk === "object" && chunk && "type" in chunk && typeof chunk.type === "string") {
    return chunk.type;
  }
  return null;
}

function getPayload(chunk: unknown): Record<string, unknown> {
  if (typeof chunk === "object" && chunk && "payload" in chunk && typeof chunk.payload === "object" && chunk.payload) {
    return chunk.payload as Record<string, unknown>;
  }
  return {};
}

function getToolName(payload: Record<string, unknown>) {
  return typeof payload.toolName === "string" ? payload.toolName : "unknownTool";
}

function summarizeToolResult(result: unknown) {
  if (Array.isArray(result)) {
    const first = result[0];
    const noun =
      typeof first === "object" && first && "tag" in first
        ? "tag"
        : typeof first === "object" && first && "title" in first
          ? "item"
          : "row";
    return `${result.length} ${result.length === 1 ? noun : `${noun}s`} returned`;
  }

  if (typeof result === "object" && result) {
    const keys = Object.keys(result);
    return keys.length > 0 ? `${keys.slice(0, 4).join(", ")} returned` : "Object returned";
  }

  if (typeof result === "string") {
    return result.length > 96 ? `${result.slice(0, 96)}...` : result;
  }

  return result == null ? "No result returned" : String(result);
}

function getToolTraceNote(toolName: string) {
  switch (toolName) {
    case "getTags":
      return "Checking the classification tags first so the follow-up query can be more focused.";
    case "getTasks":
      return "Looking at matching tasks with the current filters.";
    case "getEvents":
      return "Looking at matching events with the current filters.";
    case "searchItems":
      return "Searching embedded items for semantic matches.";
    default:
      return `Running ${toolName} to gather current app state.`;
  }
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function extractText(result: unknown) {
  if (typeof result === "string") return result;
  if (typeof result === "object" && result && "text" in result && typeof result.text === "string") {
    return result.text;
  }
  return "The copilot ran, but no text response was returned.";
}

function extractErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "The copilot failed while streaming a response.";
}

function chunkText(text: string) {
  return text.match(/\S+\s*/g) ?? [text];
}

function stripThinkingText(text: string) {
  return text.replace(/<thinking>[\s\S]*?<\/thinking>\s*/gi, "").trim();
}

// ---------------------------------------------------------------------------
// Mock stream helper
// ---------------------------------------------------------------------------

async function* createMockStream(message: string) {
  const reply = await getMockReply(message);
  for (const chunk of chunkText(reply)) {
    yield chunk;
    await sleep(12);
  }
}

// ---------------------------------------------------------------------------
// Streaming response
// ---------------------------------------------------------------------------

type EmitEvent = (event: ChatStreamEvent) => void;

async function emitFallbackReply(message: string, emit: EmitEvent) {
  const reply = await getMockReply(message);
  for (const chunk of chunkText(reply)) {
    emit({ type: "delta", text: chunk });
  }
}

async function processTextStream(source: unknown, splitter: ReturnType<typeof createThinkingTextSplitter>, emit: EmitEvent) {
  let emittedOutput = false;
  for await (const chunk of iterateTextStream(source)) {
    for (const part of splitter.feed(chunk)) {
      if (!part.text) continue;
      emittedOutput = true;
      emit({ type: part.type, text: part.text });
    }
  }
  return emittedOutput;
}

async function processStructuredStream(source: unknown, splitter: ReturnType<typeof createThinkingTextSplitter>, emit: EmitEvent) {
  let emittedOutput = false;

  for await (const chunk of iterateStructuredStream(source)) {
    const type = getChunkType(chunk);
    const payload = getPayload(chunk);

    if (type === "text-delta" && typeof payload.text === "string") {
      for (const part of splitter.feed(payload.text)) {
        if (!part.text) continue;
        emittedOutput = true;
        emit({ type: part.type, text: part.text });
      }
    }

    if (type === "reasoning-delta" && typeof payload.text === "string") {
      emittedOutput = true;
      emit({ type: "thinking", text: payload.text });
    }

    if (type === "tool-call") {
      emittedOutput = true;
      const toolName = getToolName(payload);
      emit({ type: "thinking", text: getToolTraceNote(toolName) });
      emit({ type: "tool_call", toolName, args: "args" in payload ? payload.args : null });
    }

    if (type === "tool-result" || type === "tool-output") {
      emittedOutput = true;
      emit({
        type: "tool_result",
        toolName: getToolName(payload),
        summary: summarizeToolResult("result" in payload ? payload.result : payload.output),
      });
    }

    if (type === "error") {
      emit({
        type: "error",
        message: extractErrorMessage("error" in payload ? payload.error : payload),
      });
    }
  }

  return emittedOutput;
}

function handleStreamingRequest(request: ChatRequest) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit: EmitEvent = (event) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        emit({ type: "meta", threadId: request.threadId });

        try {
          const splitter = createThinkingTextSplitter();
          let emittedOutput: boolean;

          if (process.env.MOCK_AGENT === "true") {
            emittedOutput = await processTextStream(createMockStream(request.message), splitter, emit);
          } else {
            const reply = await callAgentStream(request.message, request.threadId);
            emittedOutput =
              reply.streamKind === "text"
                ? await processTextStream(reply.stream, splitter, emit)
                : await processStructuredStream(reply.stream, splitter, emit);
          }

          for (const part of splitter.flush()) {
            if (!part.text) continue;
            emittedOutput = true;
            emit({ type: part.type, text: part.text });
          }

          if (!emittedOutput) {
            await emitFallbackReply(request.message, emit);
          }

          emit({ type: "done" });
        } catch (error) {
          try {
            await emitFallbackReply(request.message, emit);
            emit({ type: "done" });
          } catch {
            emit({ type: "error", message: extractErrorMessage(error) });
          }
        } finally {
          controller.close();
        }
      },
    }),
    {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    },
  );
}

// ---------------------------------------------------------------------------
// Non-streaming response
// ---------------------------------------------------------------------------

async function handleNonStreamingRequest(request: ChatRequest) {
  if (process.env.MOCK_AGENT === "true") {
    const reply = await getMockReply(request.message);
    return NextResponse.json({ reply, threadId: request.threadId });
  }

  try {
    const response = await callAgentGenerate(request.message, request.threadId);
    const reply = stripThinkingText(extractText(response));

    if (!reply || reply === "The copilot ran, but no text response was returned.") {
      throw new Error("Agent returned no text");
    }

    return NextResponse.json({ reply, threadId: request.threadId });
  } catch {
    const reply = await getMockReply(request.message);
    return NextResponse.json({ reply, threadId: request.threadId });
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(httpRequest: NextRequest) {
  await ensureSchema();

  const request = parseChatRequest(await httpRequest.json());
  if (!request) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  return request.stream
    ? handleStreamingRequest(request)
    : handleNonStreamingRequest(request);
}
