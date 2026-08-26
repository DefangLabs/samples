/**
 * Model resolution.
 *
 * The application never talks to Bedrock, Vertex AI, or Foundry directly.
 * Compose declares a `chat` model, and Defang injects an OpenAI-compatible
 * endpoint into this service:
 *   - CHAT_URL
 *   - CHAT_MODEL
 *   - OPENAI_API_KEY (the gateway key, not a provider key)
 *
 * The same three variables work on local Docker Model Runner, AWS, GCP, and
 * Azure, so no provider API key is ever stored in the deployment.
 */

import type { OpenAICompatibleConfig } from "@mastra/core/llm";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

export function getChatModel(): OpenAICompatibleConfig {
  return {
    providerId: "openai",
    modelId: requireEnv("CHAT_MODEL"),
    url: requireEnv("CHAT_URL"),
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
  };
}
