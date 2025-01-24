import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
    apiKey: process.env["ANTHROPIC_API_KEY"]
    });

export const POST = async function (req: Request) {
    const { messages } = await req.json();

    const stream = await anthropic.messages.stream({
        max_tokens: 1024,
        messages: messages,
        model: 'claude-3-5-sonnet-latest',
        stream: true,
    });

    const readableStream = new ReadableStream({
        async start(controller) {
            for await (const messageStream of stream) {
                if (messageStream.type === 'content_block_delta') {
                    const delta = messageStream.delta.text;
                    if (delta) {
                        controller.enqueue(delta);
                    }
                }
            }
            controller.close();
        }
    });

    return new Response(readableStream, {
        headers: { 'Content-Type': 'text/event-stream' },
    });
}
