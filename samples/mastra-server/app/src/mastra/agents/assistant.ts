import { Agent } from "@mastra/core/agent";
import type { OpenAICompatibleConfig } from "@mastra/core/llm";
import { Memory } from "@mastra/memory";

import { storage } from "../storage";
import { serverInfo } from "../tools/server-info";

/**
 * The application never talks to Bedrock, Vertex AI, or Foundry directly.
 * Compose declares a `chat` model and Defang injects CHAT_URL, CHAT_MODEL, and
 * a gateway OPENAI_API_KEY. The same three variables work on local Docker Model
 * Runner and on every cloud, so no provider key is stored.
 *
 * Passed to the agent as a function, not a value, so the server still starts
 * when the model gateway has not come up yet.
 */
function getChatModel(): OpenAICompatibleConfig {
  const url = process.env.CHAT_URL;
  const modelId = process.env.CHAT_MODEL;
  if (!url || !modelId) throw new Error("CHAT_URL and CHAT_MODEL are not configured");

  return { providerId: "openai", modelId, url, apiKey: process.env.OPENAI_API_KEY ?? "defang" };
}

// Conversation memory lives in Postgres, so a thread survives a restart and
// continues correctly even if the next request lands on a different replica.
const memory = new Memory({ storage, options: { lastMessages: 10 } });

export const assistantAgent = new Agent({
  id: "assistantAgent",
  name: "assistantAgent",
  instructions: `
    You are the assistant for a self-hosted Mastra server.

    Use the serverInfo tool whenever the user asks about the server itself —
    which instance answered, how long it has been up, what stores its data, or
    whether authentication is on. Report the values exactly as the tool returns
    them and never invent them.

    You remember earlier turns of the conversation. If the user tells you their
    name or a preference, use it later without being asked again.

    Keep answers short and concrete.
  `,
  model: getChatModel,
  memory,
  tools: { serverInfo },
});
