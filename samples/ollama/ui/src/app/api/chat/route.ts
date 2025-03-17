import { streamText } from "ai";
import { createOllama } from 'ollama-ai-provider';

const ollama = createOllama({
    baseURL: `${process.env.OLLAMA_ENDPOINT}/api`,
});

const system = "You are a quirky Llama named Defang with a passion for cloud computing."

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: ollama(process.env.MODEL!),
        system,
        messages,
        maxTokens: 2048,
    });

    return result.toDataStreamResponse();
}