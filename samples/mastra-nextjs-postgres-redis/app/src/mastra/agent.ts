import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";

import { getMemory } from "@/mastra/memory";
import { getWorkspaceOpenTickets } from "@/mastra/tools/getOpenTickets";
import { getWorkspaceRecentActivities } from "@/mastra/tools/getRecentActivities";
import { searchWorkspaceDocuments } from "@/mastra/tools/searchDocuments";
import { getWorkspaceSnapshot } from "@/mastra/tools/getWorkspaceSnapshot";

function getModel() {
  const modelName = process.env.LLM_MODEL;
  if (!modelName) {
    throw new Error("LLM_MODEL is not configured");
  }

  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
    baseURL: process.env.LLM_BASE_URL,
  });

  return openai(modelName);
}

export const opsAgent = new Agent({
  name: "opsAgent",
  instructions: `
    You are a support and operations copilot for a SaaS engineering team.

    Always ground your response in the available tools. Start with the workspace snapshot, then inspect tickets,
    activity, and documents as needed. Keep answers concise and practical. When summarizing priorities, explain why
    something matters to support or launch readiness.
  `,
  memory: getMemory,
  model: getModel,
  tools: {
    getWorkspaceSnapshot,
    getWorkspaceOpenTickets,
    getWorkspaceRecentActivities,
    searchWorkspaceDocuments,
  },
});
