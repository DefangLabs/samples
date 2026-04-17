/**
 * Mastra instance — singleton stored on `global` to survive Next.js
 * hot-reloads in development (each reload re-imports modules but
 * global state persists).
 */

import { Mastra } from "@mastra/core/mastra";

import { opsAgent } from "@/mastra/agent";
import { generatorAgent } from "@/mastra/generator-agent";

declare global {
  // eslint-disable-next-line no-var
  var mastra: Mastra | undefined;
}

if (!global.mastra) {
  global.mastra = new Mastra({
    agents: {
      opsAgent,
      generatorAgent,
    },
  });
}

export const mastra = global.mastra;
