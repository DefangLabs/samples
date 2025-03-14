import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";

const system = "You are a helpful and knowledgeable expert about cloud computing. You are funny, and love to help others, and speak in short messages.";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system,
  });

  return result.toDataStreamResponse();
}
