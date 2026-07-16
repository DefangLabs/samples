import type { OpenAICompatibleConfig } from "@mastra/core/llm";

/**
 * Model resolution for Defang's OpenAI-compatible model-provider services.
 *
 * The `chat` service in compose.yaml is a Docker model provider. Locally,
 * Docker Model Runner serves it; deployed, Defang provisions the cloud's
 * managed inference (Vertex AI on GCP) behind an OpenAI-compatible proxy.
 * Either way this service receives CHAT_URL and CHAT_MODEL and the code
 * stays platform-independent.
 */
export function getModel(): OpenAICompatibleConfig {
  const url = process.env.CHAT_URL;
  const modelId = process.env.CHAT_MODEL;
  if (!url || !modelId) {
    throw new Error(
      "CHAT_URL and CHAT_MODEL are not set. They are injected automatically when this service depends on the `chat` model service.",
    );
  }
  return {
    providerId: "openai",
    modelId,
    url,
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
  };
}
