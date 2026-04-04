import { setTimeout as sleep } from "node:timers/promises";

import { Job, Worker } from "bullmq";

import {
  embedTextForSearch,
  generateInboundEvent,
  normalizeSimulationConfig,
  simulationPlan,
  triageInboundEvent,
  triageTextForEmbedding,
  type SimulationConfig,
} from "@/lib/ai";
import { ensureSchema } from "@/lib/db";
import {
  countTriagedEventsForSync,
  finishSyncJob,
  getEventForTriage,
  insertGeneratedActivity,
  insertGeneratedTicket,
  resetWorkspaceForSimulation,
  updateSyncJobProgress,
  upsertTriageEvent,
} from "@/lib/domain";
import { getProfileLabel } from "@/lib/demo";
import { getRedisConnection, getSyncQueue } from "@/lib/queue";

type SyncJobData = {
  triggeredBy: string;
  simulation?: Partial<Pick<SimulationConfig, "profile" | "scaleFactor" | "durationSeconds">>;
};

type TriageJobData = {
  syncJobId: string;
  entityType: "ticket" | "activity";
  externalId: string;
};

function getJobId(job: Job<unknown>) {
  if (!job.id) {
    throw new Error("Job ID is required for sync processing");
  }

  return String(job.id);
}

async function handleWorkspaceSync(job: Job<SyncJobData>) {
  const jobId = getJobId(job);
  const simulationConfig = normalizeSimulationConfig(job.data.simulation);
  const ingestPlan = simulationPlan(simulationConfig);

  await updateSyncJobProgress(
    jobId,
    5,
    `Preparing ${getProfileLabel(simulationConfig.profile)} simulation at ${simulationConfig.scaleFactor}x scale (${ingestPlan.expectedEvents} events planned)`,
  );

  await resetWorkspaceForSimulation();

  const queue = getSyncQueue();
  const runStart = Date.now();

  for (let sequence = 1; sequence <= ingestPlan.expectedEvents; sequence += 1) {
    const occurredAt = new Date(runStart + sequence * simulationConfig.cadenceSeconds * 1000).toISOString();
    const event = await generateInboundEvent(simulationConfig, sequence, jobId, occurredAt);

    if (event.eventType === "ticket") {
      await insertGeneratedTicket(event, jobId);
    } else {
      await insertGeneratedActivity(event, jobId);
    }

    await queue.add(
      "triage-item",
      {
        syncJobId: jobId,
        entityType: event.eventType,
        externalId: event.externalId,
      } satisfies TriageJobData,
      {
        jobId: `triage:${jobId}:${event.externalId}`,
        attempts: 2,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 100,
      },
    );

    const ingestProgress = 10 + Math.round((sequence / ingestPlan.expectedEvents) * 55);
    await updateSyncJobProgress(
      jobId,
      ingestProgress,
      `Ingested ${sequence}/${ingestPlan.expectedEvents} external updates and queued triage jobs`,
    );

    if (sequence < ingestPlan.expectedEvents) {
      await sleep(simulationConfig.cadenceSeconds * 1000);
    }
  }

  await updateSyncJobProgress(jobId, 70, "Waiting for triage workers to classify and index generated events");

  const waitDeadline = Date.now() + Math.max(45_000, simulationConfig.durationSeconds * 2_000);

  while (Date.now() < waitDeadline) {
    const triagedCount = await countTriagedEventsForSync(jobId);
    const triageProgress = 70 + Math.round((Math.min(triagedCount, ingestPlan.expectedEvents) / ingestPlan.expectedEvents) * 25);

    await updateSyncJobProgress(
      jobId,
      triageProgress,
      `Triaged ${triagedCount}/${ingestPlan.expectedEvents} events and updated semantic index`,
    );

    if (triagedCount >= ingestPlan.expectedEvents) {
      break;
    }

    await sleep(1500);
  }

  const triagedCount = await countTriagedEventsForSync(jobId);
  const completionSummary =
    triagedCount >= ingestPlan.expectedEvents
      ? `Simulation complete: generated ${ingestPlan.expectedEvents} events and triaged all ${triagedCount}.`
      : `Simulation complete with partial triage: generated ${ingestPlan.expectedEvents} events and triaged ${triagedCount}.`;

  await finishSyncJob(jobId, "completed", completionSummary, null);

  return {
    ok: true,
    expectedEvents: ingestPlan.expectedEvents,
    triagedCount,
  };
}

async function handleTriageJob(job: Job<TriageJobData>) {
  const { syncJobId, entityType, externalId } = job.data;
  const event = await getEventForTriage(entityType, externalId);

  if (!event) {
    throw new Error(`Missing ${entityType} record for ${externalId}`);
  }

  const triage = await triageInboundEvent(event);
  const embedding = await embedTextForSearch(triageTextForEmbedding(event, triage));
  await upsertTriageEvent(syncJobId, event, triage, embedding);

  return {
    ok: true,
    externalId,
  };
}

async function main() {
  await ensureSchema();

  const worker = new Worker(
    process.env.QUEUE_NAME ?? "support-sync",
    async (job) => {
      if (job.name === "workspace-sync") {
        return handleWorkspaceSync(job as Job<SyncJobData>);
      }

      if (job.name === "triage-item") {
        return handleTriageJob(job as Job<TriageJobData>);
      }

      return {
        ok: false,
        ignored: true,
      };
    },
    {
      connection: getRedisConnection(),
      concurrency: Number(process.env.WORKER_CONCURRENCY ?? 6),
    },
  );

  worker.on("failed", async (job, error) => {
    if (!job?.id) return;

    if (job.name === "workspace-sync") {
      await finishSyncJob(String(job.id), "failed", null, error.message);
      return;
    }

    console.error(`Triage job failed (${job.id}):`, error.message);
  });

  console.log("Sprintlane mission-control worker is running");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
