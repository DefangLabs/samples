import { setTimeout as sleep } from "node:timers/promises";

import { Worker } from "bullmq";

import { ensureSchema } from "@/lib/db";
import { finishSyncJob, seedWorkspaceData, updateSyncJobProgress } from "@/lib/domain";
import { getRedisConnection } from "@/lib/queue";

async function main() {
  await ensureSchema();

  const worker = new Worker(
    process.env.QUEUE_NAME ?? "support-sync",
    async (job) => {
      await updateSyncJobProgress(job.id!, 20, "Loading sample docs and ticket fixtures");
      await sleep(250);
      await seedWorkspaceData();

      await updateSyncJobProgress(job.id!, 70, "Writing dashboard snapshot and finalizing sync state");
      await sleep(250);
      await finishSyncJob(job.id!, "completed", "Workspace sync complete", null);

      return { ok: true };
    },
    {
      connection: getRedisConnection(),
    },
  );

  worker.on("failed", async (job, error) => {
    if (!job?.id) return;
    await finishSyncJob(job.id, "failed", null, error.message);
  });

  console.log("Support sync worker is running");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
