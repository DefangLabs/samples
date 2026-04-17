/**
 * Model resolution for Defang's OpenAI-compatible `provider: model` services.
 *
 * The application never talks to Bedrock or Vertex directly. Instead, Compose
 * defines dedicated `chat` and `embedding` services, and Defang injects:
 *   - CHAT_URL / CHAT_MODEL
 *   - EMBEDDING_URL / EMBEDDING_MODEL
 *
 * Those endpoints stay stable across local Docker Model Runner, Playground,
 * AWS, and GCP. The app code only sees OpenAI-compatible URLs plus model IDs.
 */

import type { OpenAICompatibleConfig } from "@mastra/core/llm";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function getOpenAICompatibleConfig(urlEnv: string, modelEnv: string): OpenAICompatibleConfig {
  return {
    providerId: "openai",
    modelId: requireEnv(modelEnv),
    url: requireEnv(urlEnv),
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
  };
}

export function hasChatAccess() {
  return Boolean(process.env.CHAT_URL && process.env.CHAT_MODEL);
}

export function hasEmbeddingAccess() {
  return Boolean(process.env.EMBEDDING_URL && process.env.EMBEDDING_MODEL);
}

export function getMastraModel() {
  return getOpenAICompatibleConfig("CHAT_URL", "CHAT_MODEL");
}

export function getMastraEmbeddingModel() {
  return new ModelRouterEmbeddingModel(getOpenAICompatibleConfig("EMBEDDING_URL", "EMBEDDING_MODEL"));
}
