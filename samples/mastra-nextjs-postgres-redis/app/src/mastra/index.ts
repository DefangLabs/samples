import { Mastra } from "@mastra/core/mastra";

import { opsAgent } from "@/mastra/agent";

declare global {
  // eslint-disable-next-line no-var
  var mastra: Mastra | undefined;
}

if (!global.mastra) {
  global.mastra = new Mastra({
    agents: {
      opsAgent,
    },
    telemetry: {
      enabled: false,
    },
  });
}

export const mastra = global.mastra;
