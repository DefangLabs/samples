import IORedis from "ioredis";
import { Queue } from "bullmq";

export const QUEUE_NAME = process.env.QUEUE_NAME ?? "support-sync";
// Hash-tag wrapping forces every BullMQ key for this queue (wait/active/events/…)
// onto the same Redis cluster slot, so multi-key Lua scripts don't trip CROSSSLOT
// on sharded backends like Azure Managed Redis.
export const QUEUE_PREFIX = `{${QUEUE_NAME}}`;

declare global {
  // eslint-disable-next-line no-var
  var redisConnection: IORedis | undefined;
  // eslint-disable-next-line no-var
  var syncQueue: Queue | undefined;
}

export function getRedisConnection() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!global.redisConnection) {
    global.redisConnection = new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return global.redisConnection;
}

export function getSyncQueue() {
  if (!global.syncQueue) {
    global.syncQueue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      prefix: QUEUE_PREFIX,
    });
  }

  return global.syncQueue;
}

export async function getQueueCounts() {
  const queue = getSyncQueue();
  const counts = await queue.getJobCounts("waiting", "active", "completed", "failed", "delayed", "paused");

  return {
    waiting: counts.waiting ?? 0,
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    failed: counts.failed ?? 0,
    delayed: counts.delayed ?? 0,
    paused: counts.paused ?? 0,
  };
}
