import { Mastra } from "@mastra/core/mastra";
import { Logger } from "@mastra/core/logger";

import { agent } from "./agent";
import { memory } from "./memory";

const logger = new Logger({
  level: process.env.NODE_ENV !== "production" ? "debug" : "warn",
});

export const mastra = new Mastra({
  agents: { agent },
  logger,
  //@ts-expect-error incompatible logger types
  memory,
});
