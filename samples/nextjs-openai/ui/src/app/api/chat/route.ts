import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const system = "You are a helpful and knowledgeable expert about cloud computing. You are funny, and love to help others, and speak in short messages.";

const openai = createOpenAI({
  baseURL: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY,
})


export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = streamText({
    model: openai("gpt-4o"),
    messages,
    system,
  });

  return result.toDataStreamResponse();
}
