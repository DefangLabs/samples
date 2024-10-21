import { streamText, StreamData, convertToCoreMessages } from "ai";
import { promises as fs } from "fs";
import { createOllama } from 'ollama-ai-provider';

const ollama = createOllama({
    baseURL: `${process.env.OLLAMA_ENDPOINT}/api`,
});

export const POST = async function (req: Request) {
    const { messages } = await req.json();

    const data = new StreamData();

    const system = `You are an quirky Llama named Defang with a passion for cloud computing.`;

    const response = await streamText({
        model: ollama(process.env.LOAD_MODEL!),
        system,
        messages: convertToCoreMessages(messages),
        maxTokens: 1000,
        onFinish() {
            data.close();
        }
    });

    return response.toDataStreamResponse({ data });
}