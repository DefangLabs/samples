import Anthropic from '@anthropic-ai/sdk';
import { AnthropicStream, StreamingTextResponse } from 'ai';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await anthropic.messages.stream({
    messages,
    model: 'claude-3-5-sonnet-20241022',
    stream: true,
    system: "You are a helpful and knowledgeable expert about cloud computing. You are funny, and love to help others, and speak in short messages.",
    max_tokens: 1024,
  });

  const stream = AnthropicStream(response);
  return new StreamingTextResponse(stream);
}
