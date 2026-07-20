import type { OpenAICompatibleConfig } from "@mastra/core/llm";

/**
 * Model resolution for Defang's OpenAI-compatible model-provider services.
 *
 * The `chat` service in compose.yaml is a Defang model provider. Deployed,
 * Defang provisions the cloud's managed inference behind an OpenAI-compatible
 * proxy and injects CHAT_URL and CHAT_MODEL into this service, so the agent
 * code stays platform-independent.
 */
export function getModel(): OpenAICompatibleConfig {
  const url = process.env.CHAT_URL;
  const modelId = process.env.CHAT_MODEL;
  if (!url || !modelId) {
    throw new Error(
      "CHAT_URL and CHAT_MODEL are not set. They are injected from the `chat` model-provider service in compose.yaml.",
    );
  }
  return {
    providerId: "openai",
    modelId,
    url,
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
  };
}
