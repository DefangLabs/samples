import { Memory } from "@mastra/memory";
import { PostgresStore } from "@mastra/pg";

declare global {
  // eslint-disable-next-line no-var
  var mastraPgStore: PostgresStore | undefined;
  // eslint-disable-next-line no-var
  var mastraMemory: Memory | undefined;
}

function getPgStore() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!global.mastraPgStore) {
    global.mastraPgStore = new PostgresStore({
      id: "mastra-pg",
      connectionString: process.env.DATABASE_URL,
    });
  }

  return global.mastraPgStore;
}

export function getMemory() {
  if (!global.mastraMemory) {
    global.mastraMemory = new Memory({
      storage: getPgStore(),
      options: {
        lastMessages: 8,
      },
    });
  }

  return global.mastraMemory;
}
