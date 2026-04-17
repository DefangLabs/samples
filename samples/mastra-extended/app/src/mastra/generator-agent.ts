/**
 * A minimal Mastra agent for one-shot text/JSON generation.
 * Used by the background worker for seed item generation and classification.
 * Unlike opsAgent, it has no tools or memory — just the model, so it can
 * be used for simple prompt-response tasks while still going through
 * Mastra's provider-agnostic model router.
 */

import { Agent } from "@mastra/core/agent";

import { getMastraModel } from "@/lib/model";

export const generatorAgent = new Agent({
  id: "generatorAgent",
  name: "generatorAgent",
  instructions: "You are a helpful assistant that follows instructions precisely and returns exactly the requested format.",
  model: getMastraModel,
});
