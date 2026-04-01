import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { recordSyncJob } from "@/lib/domain";
import { getSyncQueue } from "@/lib/queue";

export const runtime = "nodejs";

export async function POST() {
  await ensureSchema();

  const jobId = randomUUID();
  await recordSyncJob(jobId, "queued", 0);

  const queue = getSyncQueue();
  await queue.add(
    "workspace-sync",
    { triggeredBy: "dashboard" },
    {
      jobId,
      removeOnComplete: 20,
      removeOnFail: 20,
    },
  );

  return NextResponse.json({ jobId });
}
