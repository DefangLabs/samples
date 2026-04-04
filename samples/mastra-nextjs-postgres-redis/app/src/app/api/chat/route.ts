import { randomUUID } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { NextRequest, NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { companyContext } from "@/lib/demo";
import { getDashboardSnapshot, getOpenTickets, getRecentActivities } from "@/lib/domain";
import { getMockReply } from "@/lib/mock-agent";
import { mastra } from "@/mastra";

export const runtime = "nodejs";

type ChatStreamEvent =
  | { type: "meta"; threadId: string }
  | { type: "delta"; text: string }
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

function shouldDisableToolCalls() {
  const override = process.env.LLM_DISABLE_TOOLS;
  if (override === "true") return true;
  if (override === "false") return false;

  // Bedrock-backed Mistral via OpenAI-compatible gateways can reject blank
  // content blocks emitted in tool-call turns. Default to no-tools for those models.
  const modelName = process.env.LLM_MODEL?.toLowerCase() ?? "";
  return modelName.includes("mistral");
}

async function buildWorkspaceContext() {
  const [snapshot, tickets, activities] = await Promise.all([
    getDashboardSnapshot(),
    getOpenTickets(),
    getRecentActivities(5),
  ]);

  const topTickets = tickets
    .slice(0, 3)
    .map(
      (ticket) =>
        `- ${ticket.externalId} (${ticket.priority}/${ticket.status}${ticket.riskScore ? `, risk ${ticket.riskScore}` : ""}): ${ticket.title}`,
    )
    .join("\n");

  const recentActivity = activities
    .slice(0, 3)
    .map(
      (activity) =>
        `- ${activity.kind}${activity.riskScore ? ` (risk ${activity.riskScore})` : ""}: ${activity.title}`,
    )
    .join("\n");

  return [
    `Current ${companyContext.name} application state from the database:`,
    `- Open tasks: ${snapshot.openTicketCount}`,
    `- Total task rows: ${snapshot.taskCount}`,
    `- Event rows: ${snapshot.activityCount}`,
    `- Seed/reference documents: ${snapshot.documentCount}`,
    `- Classified records: ${snapshot.triagedCount}`,
    snapshot.latestJob
      ? `- Latest sync job: ${snapshot.latestJob.status} (${snapshot.latestJob.progress}%)`
      : "- Latest sync job: none",
    "",
    "Top open tasks:",
    topTickets || "- none",
    "",
    "Recent events:",
    recentActivity || "- none",
  ].join("\n");
}

async function streamReply(message: string, threadId: string) {
  if (process.env.MOCK_AGENT === "true") {
    const reply = await getMockReply(message);
    const chunks = reply.match(/\S+\s*/g) ?? [reply];

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
  const disableToolCalls = shouldDisableToolCalls();
  const toolChoice = disableToolCalls ? "none" : "auto";
  const messageInput = disableToolCalls ? `${await buildWorkspaceContext()}\n\nUser request:\n${message}` : message;

  if (model.specificationVersion === "v2") {
    const response = await agent.stream(messageInput, {
      resourceId: "support-ops",
      threadId,
      maxSteps: 6,
      toolChoice,
    });

    return { stream: response.textStream, threadId };
  }

  const response = await agent.streamLegacy(messageInput, {
    resourceId: "support-ops",
    threadId,
    maxSteps: 6,
    toolChoice,
  });

  return { stream: response.textStream, threadId };
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
            for await (const chunk of iterateTextChunks(reply.stream)) {
              if (!chunk) continue;
              writeEvent(controller, { type: "delta", text: chunk });
            }

            writeEvent(controller, { type: "done" });
          } catch (error) {
            writeEvent(controller, { type: "error", message: extractErrorMessage(error) });
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

  const agent = mastra.getAgent("opsAgent");
  const model = await agent.getModel();
  const disableToolCalls = shouldDisableToolCalls();
  const toolChoice = disableToolCalls ? "none" : "auto";
  const messageInput = disableToolCalls
    ? `${await buildWorkspaceContext()}\n\nUser request:\n${message}`
    : message;
  const response =
    model.specificationVersion === "v2"
      ? await agent.generate(messageInput, {
          resourceId: "support-ops",
          threadId: resolvedThreadId,
          maxSteps: 6,
          toolChoice,
        })
      : await agent.generateLegacy(messageInput, {
          resourceId: "support-ops",
          threadId: resolvedThreadId,
          maxSteps: 6,
          toolChoice,
        });

  return NextResponse.json({
    reply: extractText(response),
    threadId: resolvedThreadId,
  });
}
