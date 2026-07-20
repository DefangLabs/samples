import type { OpenAICompatibleConfig } from "@mastra/core/llm";

/**
 * Model resolution for Defang's OpenAI-compatible model-provider services.
 *
 * The `chat` model in compose.yaml is a Docker Compose model (top-level
 * `models:` key). Locally, Docker Model Runner serves it; deployed, Defang
 * provisions the cloud's managed inference (Amazon Bedrock on AWS) behind an
 * OpenAI-compatible proxy. Either way the dev service's `models:` mapping
 * injects CHAT_URL and CHAT_MODEL and the code stays platform-independent.
 */
export function getModel(): OpenAICompatibleConfig {
  const url = process.env.CHAT_URL;
  const modelId = process.env.CHAT_MODEL;
  if (!url || !modelId) {
    throw new Error(
      "CHAT_URL and CHAT_MODEL are not set. They are injected by the service's `models:` mapping for the `chat` model in compose.yaml.",
    );
  }
  return {
    providerId: "openai",
    modelId,
    url,
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
  };
}
