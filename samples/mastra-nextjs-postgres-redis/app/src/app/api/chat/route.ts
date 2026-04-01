import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { getMockReply } from "@/lib/mock-agent";
import { mastra } from "@/mastra";

export const runtime = "nodejs";

function extractText(result: unknown) {
  if (typeof result === "string") return result;
  if (typeof result === "object" && result && "text" in result && typeof result.text === "string") {
    return result.text;
  }
  return "The copilot ran, but no text response was returned.";
}

export async function POST(request: NextRequest) {
  await ensureSchema();
  const { message, threadId } = await request.json();
  const resolvedThreadId = threadId ?? randomUUID();

  if (!message || typeof message !== "string") {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  if (process.env.MOCK_AGENT === "true") {
    const reply = await getMockReply(message);
    return NextResponse.json({ reply, threadId: resolvedThreadId });
  }

  const agent = mastra.getAgent("opsAgent");
  const response = await agent.generate(message, {
    resourceId: "support-ops",
    threadId: resolvedThreadId,
    maxSteps: 6,
  });

  return NextResponse.json({
    reply: extractText(response),
    threadId: resolvedThreadId,
  });
}
