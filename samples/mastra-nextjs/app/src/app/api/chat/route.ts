import type { NextRequest } from "next/server";

import { mastra } from "@/mastra";
import { memory } from "@/mastra/memory";
import type { CoreUserMessage } from "@assistant-ui/react";

export async function POST(req: NextRequest) {
  if (!mastra.memory) throw new Error("Mastra memory not set up");
  const resourceId = req.cookies.get("resourceId")!.value;

  const { messages, owner, repo, threadId } = await req.json();

  const agent = mastra.getAgent("agent");

  /**
   * Since we're manually creating threads, this ensures we generate a title from the first user message
   */
  if (messages.length === 1) {
    const thread = await mastra.memory?.getThreadById({ threadId });

    if (!thread?.title || thread?.title === "New Thread") {
      const agent = mastra.getAgent("agent");
      const title = await agent.generateTitleFromUserMessage({
        message: messages.filter((m: CoreUserMessage) => m.role === "user")[0],
      });
      await memory.updateThread({
        id: threadId,
        title,
        metadata: { owner, repo, nextThread: false },
      });
    }
  }

  try {
    const res = await agent.stream(messages, {
      context: [
        {
          role: "system",
          content: `The repository owner is ${owner} and the repository name is ${repo}`,
        },
      ],
      resourceId,
      threadId,
      toolChoice: "auto",
      maxSteps: 10,
    });
    return res.toDataStreamResponse();
  } catch (error) {
    console.error(error);
    throw error;
  }
}
