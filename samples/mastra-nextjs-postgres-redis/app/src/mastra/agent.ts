import { Agent } from "@mastra/core/agent";
import type { OpenAICompatibleConfig } from "@mastra/core/llm";

import { companyContext } from "@/lib/demo";
import { getMemory } from "@/mastra/memory";
import { getWorkspaceOpenTickets } from "@/mastra/tools/getOpenTickets";
import { getWorkspaceRecentActivities } from "@/mastra/tools/getRecentActivities";
import { searchWorkspaceDocuments } from "@/mastra/tools/searchDocuments";
import { searchWorkspaceTriageInsights } from "@/mastra/tools/searchTriageInsights";
import { getWorkspaceSnapshot } from "@/mastra/tools/getWorkspaceSnapshot";

function shouldDisableToolCalls() {
  const override = process.env.LLM_DISABLE_TOOLS;
  if (override === "true") return true;
  if (override === "false") return false;

  const modelName = process.env.LLM_MODEL?.toLowerCase() ?? "";
  return modelName.includes("mistral");
}

function getModel(): OpenAICompatibleConfig {
  const modelName = process.env.LLM_MODEL;
  if (!modelName) {
    throw new Error("LLM_MODEL is not configured");
  }

  return {
    providerId: "openai",
    modelId: modelName,
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
    url: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1",
  };
}

const workspaceTools = {
  getWorkspaceSnapshot,
  getWorkspaceOpenTickets,
  getWorkspaceRecentActivities,
  searchWorkspaceDocuments,
  searchWorkspaceTriageInsights,
};

const disableToolCalls = shouldDisableToolCalls();

export const opsAgent = new Agent({
  name: "opsAgent",
  instructions: disableToolCalls
    ? `
      You are the customer-operations copilot for ${companyContext.name}, an AI project management startup.

      Keep answers concise and practical. If key workspace data is not provided in the conversation context, say that
      clearly instead of inventing it.
    `
    : `
      You are the customer-operations copilot for ${companyContext.name}, an AI project management startup.

      ${companyContext.productSummary}

      Always ground your response in the available tools. Start with the workspace snapshot, then inspect tickets,
      activity, and documents as needed. Use semantic triage insight search when the user asks for similar incidents,
      patterns, or precedent. Keep answers concise and practical. When summarizing priorities, explain why something
      matters to customer rollout health, planning reliability, or compliance exposure.
    `,
  memory: getMemory,
  model: getModel,
  tools: disableToolCalls ? undefined : workspaceTools,
});
