import type { OpenAICompatibleConfig } from "@mastra/core/llm";

/**
 * Model resolution for Defang's OpenAI-compatible managed model gateway.
 *
 * The `chat` model is declared as a top-level `models:` entry in compose.yaml.
 * Deployed, Defang provisions the cloud's managed inference behind an
 * OpenAI-compatible proxy and injects CHAT_URL and CHAT_MODEL into the agent
 * service, so the agent code stays platform-independent.
 */
export function getModel(): OpenAICompatibleConfig {
  const url = process.env.CHAT_URL;
  const modelId = process.env.CHAT_MODEL;
  if (!url || !modelId) {
    throw new Error(
      "CHAT_URL and CHAT_MODEL are not set. They are injected from the `chat` model declared in compose.yaml.",
    );
  }
  return {
    providerId: "openai",
    modelId,
    url,
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
  };
}
