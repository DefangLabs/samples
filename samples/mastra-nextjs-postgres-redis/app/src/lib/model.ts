/**
 * Provider-agnostic model configuration.
 *
 * LLM_MODEL and EMBEDDING_MODEL use the `provider/model` format:
 *   - "bedrock/us.amazon.nova-pro-v1:0"      (AWS Bedrock)
 *   - "openai/gpt-4o"                         (OpenAI)
 *   - "anthropic/claude-sonnet-4-5-20250514"  (Anthropic)
 *   - "google/gemini-2.0-flash"               (Google)
 *
 * The same sample deploys to any cloud — users only change the model env var.
 *
 * Under the hood: Mastra's model router handles API-key providers (OpenAI,
 * Anthropic, Google, etc.) automatically. Bedrock uses IAM role auth on AWS,
 * so it gets a dedicated path via the AWS SDK. Neither path is exposed to
 * the app code, which just calls `getMastraModel()` / `getMastraEmbeddingModel()`.
 */

import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { OpenAICompatibleConfig } from "@mastra/core/llm";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

function parseModelId(envVar: string) {
  const value = process.env[envVar];
  if (!value) throw new Error(`${envVar} is not configured`);

  const slashIndex = value.indexOf("/");
  if (slashIndex === -1) return { provider: "", modelName: value, raw: value };

  return {
    provider: value.slice(0, slashIndex),
    modelName: value.slice(slashIndex + 1),
    raw: value,
  };
}

function getBedrockProvider() {
  return createAmazonBedrock({ credentialProvider: fromNodeProviderChain() });
}

export function getMastraModel() {
  const { provider, modelName, raw } = parseModelId("LLM_MODEL");

  // Bedrock uses AWS IAM credentials, not an API key.
  if (provider === "bedrock") {
    return getBedrockProvider()(modelName);
  }

  // All other providers go through Mastra's model router.
  return { id: raw as `${string}/${string}` } satisfies OpenAICompatibleConfig;
}

export function getMastraEmbeddingModel() {
  const { provider, modelName, raw } = parseModelId("EMBEDDING_MODEL");

  if (provider === "bedrock") {
    return getBedrockProvider().embedding(modelName);
  }

  return new ModelRouterEmbeddingModel(raw as `${string}/${string}`);
}
