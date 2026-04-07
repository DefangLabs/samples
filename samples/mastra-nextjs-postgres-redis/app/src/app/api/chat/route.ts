import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";

import { NextRequest, NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getMockReply } from "@/lib/mock-agent";
import { mastra } from "@/mastra";

export const runtime = "nodejs";

type ChatStreamEvent =
  | { type: "meta"; threadId: string }
  | { type: "delta"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_call"; toolName: string; args: unknown }
  | { type: "tool_result"; toolName: string; summary: string }
  | { type: "done" }
  | { type: "error"; message: string };

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

function isReadableStream(value: unknown): value is ReadableStream<unknown> {
  return typeof value === "object" && value !== null && "getReader" in value;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return typeof value === "object" && value !== null && Symbol.asyncIterator in value;
}

async function* iterateTextChunks(source: unknown): AsyncGenerator<string> {
  if (!source) return;

  if (isReadableStream(source)) {
    const reader = source.getReader();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (typeof value === "string") {
          yield value;
        } else if (value instanceof Uint8Array) {
          yield new TextDecoder().decode(value);
        }
      }
    } finally {
      reader.releaseLock();
    }

    return;
  }

  if (isAsyncIterable(source)) {
    for await (const chunk of source) {
      if (typeof chunk === "string") {
        yield chunk;
      }
    }
  }
}

async function* iterateStreamChunks(source: unknown): AsyncGenerator<unknown> {
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

function splitThinkingText() {
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

function getChunkType(chunk: unknown) {
  if (typeof chunk === "object" && chunk && "type" in chunk && typeof chunk.type === "string") {
    return chunk.type;
  }

  return null;
}

function getPayload(chunk: unknown): Record<string, unknown> {
  if (
    typeof chunk === "object" &&
    chunk &&
    "payload" in chunk &&
    typeof chunk.payload === "object" &&
    chunk.payload
  ) {
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

async function streamReply(message: string, threadId: string) {
  if (process.env.MOCK_AGENT === "true") {
    const reply = await getMockReply(message);
    const chunks = chunkText(reply);

    async function* mockChunkStream() {
      for (const chunk of chunks) {
        yield chunk;
        await sleep(12);
      }
    }

    return { stream: mockChunkStream(), threadId };
  }

  const agent = mastra.getAgent("opsAgent");
  const model = await agent.getModel();
  const toolChoice = process.env.LLM_DISABLE_TOOLS === "true" ? "none" : "auto";

  const response =
    model.specificationVersion === "v2"
      ? await agent.stream(message, {
          resourceId: "tasks-and-events",
          threadId,
          maxSteps: 15,
          toolChoice,
        })
      : await agent.streamLegacy(message, {
          resourceId: "tasks-and-events",
          threadId,
          maxSteps: 15,
          toolChoice,
        });

  return {
    stream: model.specificationVersion === "v2" ? response.fullStream : response.textStream,
    streamKind: model.specificationVersion === "v2" ? "full" : "text",
    threadId,
  };
}

export async function POST(request: NextRequest) {
  await ensureSchema();
  const payload = await request.json();
  const message = typeof payload?.message === "string" ? payload.message : null;
  const incomingThreadId = typeof payload?.threadId === "string" ? payload.threadId : undefined;
  const stream = payload?.stream === true;
  const resolvedThreadId = incomingThreadId ?? randomUUID();

  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  if (stream) {
    const encoder = new TextEncoder();
    const writeEvent = (
      controller: ReadableStreamDefaultController<Uint8Array>,
      event: ChatStreamEvent,
    ) => {
      controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
    };

    return new Response(
      new ReadableStream<Uint8Array>({
        async start(controller) {
          writeEvent(controller, { type: "meta", threadId: resolvedThreadId });

          try {
            const reply = await streamReply(message, resolvedThreadId);
            let emittedOutput = false;
            const splitter = splitThinkingText();

            if (reply.streamKind === "text") {
              for await (const chunk of iterateTextChunks(reply.stream)) {
                for (const part of splitter.feed(chunk)) {
                  if (!part.text) continue;
                  emittedOutput = true;
                  writeEvent(controller, { type: part.type, text: part.text });
                }
              }
            } else {
              for await (const chunk of iterateStreamChunks(reply.stream)) {
                const type = getChunkType(chunk);
                const payload = getPayload(chunk);

                if (type === "text-delta" && typeof payload.text === "string") {
                  for (const part of splitter.feed(payload.text)) {
                    if (!part.text) continue;
                    emittedOutput = true;
                    writeEvent(controller, { type: part.type, text: part.text });
                  }
                }

                if (type === "reasoning-delta" && typeof payload.text === "string") {
                  emittedOutput = true;
                  writeEvent(controller, { type: "thinking", text: payload.text });
                }

                if (type === "tool-call") {
                  emittedOutput = true;
                  const toolName = getToolName(payload);
                  writeEvent(controller, { type: "thinking", text: getToolTraceNote(toolName) });
                  writeEvent(controller, {
                    type: "tool_call",
                    toolName,
                    args: "args" in payload ? payload.args : null,
                  });
                }

                if (type === "tool-result" || type === "tool-output") {
                  emittedOutput = true;
                  writeEvent(controller, {
                    type: "tool_result",
                    toolName: getToolName(payload),
                    summary: summarizeToolResult("result" in payload ? payload.result : payload.output),
                  });
                }

                if (type === "error") {
                  writeEvent(controller, {
                    type: "error",
                    message: extractErrorMessage("error" in payload ? payload.error : payload),
                  });
                }
              }
            }

            for (const part of splitter.flush()) {
              if (!part.text) continue;
              emittedOutput = true;
              writeEvent(controller, { type: part.type, text: part.text });
            }

            if (!emittedOutput) {
              const fallback = await getMockReply(message);
              for (const chunk of chunkText(fallback)) {
                writeEvent(controller, { type: "delta", text: chunk });
              }
            }

            writeEvent(controller, { type: "done" });
          } catch (error) {
            try {
              const fallback = await getMockReply(message);
              for (const chunk of chunkText(fallback)) {
                writeEvent(controller, { type: "delta", text: chunk });
              }
              writeEvent(controller, { type: "done" });
            } catch {
              writeEvent(controller, { type: "error", message: extractErrorMessage(error) });
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

  if (process.env.MOCK_AGENT === "true") {
    const reply = await getMockReply(message);
    return NextResponse.json({ reply, threadId: resolvedThreadId });
  }

  try {
    const agent = mastra.getAgent("opsAgent");
    const model = await agent.getModel();
    const toolChoice = process.env.LLM_DISABLE_TOOLS === "true" ? "none" : "auto";
    const response =
      model.specificationVersion === "v2"
        ? await agent.generate(message, {
            resourceId: "tasks-and-events",
            threadId: resolvedThreadId,
            maxSteps: 15,
            toolChoice,
          })
        : await agent.generateLegacy(message, {
            resourceId: "tasks-and-events",
            threadId: resolvedThreadId,
            maxSteps: 15,
            toolChoice,
          });

    const reply = stripThinkingText(extractText(response));
    if (!reply || reply === "The copilot ran, but no text response was returned.") {
      throw new Error("Agent returned no text");
    }

    return NextResponse.json({
      reply,
      threadId: resolvedThreadId,
    });
  } catch {
    const reply = await getMockReply(message);
    return NextResponse.json({ reply, threadId: resolvedThreadId });
  }
}
