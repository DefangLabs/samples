import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { normalizeSimulationConfig } from "@/lib/ai";
import { ensureSchema } from "@/lib/db";
import { simulationProfiles } from "@/lib/demo";
import { recordSyncJob } from "@/lib/domain";
import { getSyncQueue } from "@/lib/queue";

export const runtime = "nodejs";

const syncPayloadSchema = z
  .object({
    profile: z.enum(simulationProfiles).optional(),
    scaleFactor: z.number().int().min(1).max(5).optional(),
    durationSeconds: z.number().int().min(30).max(300).optional(),
  })
  .optional();

export async function POST(request: NextRequest) {
  await ensureSchema();

  let payload: z.infer<typeof syncPayloadSchema>;
  try {
    const body = await request.json();
    const parsed = syncPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sync configuration payload" }, { status: 400 });
    }
    payload = parsed.data;
  } catch {
    payload = undefined;
  }

  const simulation = normalizeSimulationConfig(payload);
  const jobId = randomUUID();

  await recordSyncJob(jobId, "queued", 0, {
    profile: simulation.profile,
    scaleFactor: simulation.scaleFactor,
    durationSeconds: simulation.durationSeconds,
  });

  const queue = getSyncQueue();
  await queue.add(
    "workspace-sync",
    {
      triggeredBy: "dashboard",
      simulation: {
        profile: simulation.profile,
        scaleFactor: simulation.scaleFactor,
        durationSeconds: simulation.durationSeconds,
      },
    },
    {
      jobId,
      removeOnComplete: 20,
      removeOnFail: 20,
    },
  );

  return NextResponse.json({
    jobId,
    simulation,
  });
}
