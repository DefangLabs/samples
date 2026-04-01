import IORedis from "ioredis";
import { Queue } from "bullmq";

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
    global.syncQueue = new Queue(process.env.QUEUE_NAME ?? "support-sync", {
      connection: getRedisConnection(),
    });
  }

  return global.syncQueue;
}
