import { ensureSchema } from "@/lib/db";
import { getItemCounts, getLatestRun } from "@/lib/items";
import { getQueueCounts } from "@/lib/queue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await ensureSchema();

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      request.signal.addEventListener("abort", () => {
        closed = true;
      });

      let previousJson = "";
      let heartbeatCounter = 0;

      while (!closed) {
        try {
          const [counts, latestRun, queue] = await Promise.all([
            getItemCounts(),
            getLatestRun(),
            getQueueCounts(),
          ]);

          const payload = JSON.stringify({ counts, latestRun, queue });

          if (payload !== previousJson) {
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            previousJson = payload;
            heartbeatCounter = 0;
          } else {
            heartbeatCounter += 1;
            // Send heartbeat every ~50 ticks (~15s at 0.3s interval)
            if (heartbeatCounter >= 50) {
              controller.enqueue(encoder.encode(`: heartbeat\n\n`));
              heartbeatCounter = 0;
            }
          }
        } catch {
          // Transient errors — skip this tick
        }

        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
