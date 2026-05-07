import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { ensureSchema } from "@/lib/db";
import { createSeedRun, getLatestRun, resetDemoState } from "@/lib/items";
import { getSyncQueue } from "@/lib/queue";

export const runtime = "nodejs";

export async function POST() {
  await ensureSchema();

  const latestRun = await getLatestRun();
  if (latestRun && (latestRun.status === "queued" || latestRun.status === "running")) {
    return NextResponse.json({ error: "A generation run is already active." }, { status: 409 });
  }

  await resetDemoState();

  const runId = randomUUID();
  await createSeedRun(runId, 10);

  const queue = getSyncQueue();
  await queue.add(
    "seed-batch",
    { runId },
    {
      jobId: runId,
      removeOnComplete: 20,
      removeOnFail: 20,
    },
  );

  return NextResponse.json({ runId });
}
