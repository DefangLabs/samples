import { Job, Worker } from "bullmq";

import { classifyItem, embedTextForSearch, generateSeedItems, textForEmbedding } from "@/lib/ai";
import { ensureSchema } from "@/lib/db";
import {
  failSeedRun,
  finishSeedRun,
  getItemById,
  insertSeedItems,
  markItemProcessed,
  startSeedRun,
  updateProcessedItem,
} from "@/lib/items";
import { QUEUE_NAME, getRedisConnection, getSyncQueue } from "@/lib/queue";

type SeedBatchJob = {
  runId: string;
};

type ClassifyItemJob = {
  runId: string;
  itemId: number;
};

async function handleSeedBatch(job: Job<SeedBatchJob>) {
  const { runId } = job.data;
  await startSeedRun(runId, "Generating 10 tasks and 10 events with the LLM");

  const rawItems = await generateSeedItems();
  const insertedItems = await insertSeedItems(runId, rawItems);
  const queue = getSyncQueue();

  for (const item of insertedItems) {
    await queue.add(
      "classify-item",
      {
        runId,
        itemId: item.id,
      } satisfies ClassifyItemJob,
      {
        jobId: `classify:${runId}:${item.id}`,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );
  }

  await startSeedRun(runId, `Queued ${insertedItems.length} background classification jobs`);

  return {
    ok: true,
    itemCount: insertedItems.length,
  };
}

async function handleClassifyItem(job: Job<ClassifyItemJob>) {
  const { runId, itemId } = job.data;
  const item = await getItemById(itemId);

  if (!item) {
    throw new Error(`Item ${itemId} not found`);
  }

  const classification = await classifyItem(item);
  const embedding = await embedTextForSearch(textForEmbedding(item, classification));
  await updateProcessedItem(item.id, classification, embedding);
  const run = await markItemProcessed(runId);

  if (run && run.processedItems >= run.totalItems) {
    await finishSeedRun(runId, `Generated ${run.totalItems} items and classified every one of them`);
  }

  return {
    ok: true,
    itemId,
  };
}

async function main() {
  await ensureSchema();

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      if (job.name === "seed-batch") {
        return handleSeedBatch(job as Job<SeedBatchJob>);
      }

      if (job.name === "classify-item") {
        return handleClassifyItem(job as Job<ClassifyItemJob>);
      }

      return { ok: false, ignored: true };
    },
    {
      connection: getRedisConnection(),
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 8),
    },
  );

  worker.on("failed", async (job, error) => {
    const runId = typeof job?.data === "object" && job.data && "runId" in job.data ? String(job.data.runId) : null;
    if (runId) {
      await failSeedRun(runId, error.message);
    }
    console.error(`Worker job failed (${job?.name ?? "unknown"}:${job?.id ?? "n/a"}):`, error.message);
  });

  console.log("tasks-and-events worker is running");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
