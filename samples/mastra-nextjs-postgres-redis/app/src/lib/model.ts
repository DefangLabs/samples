import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { OpenAICompatibleConfig } from "@mastra/core/llm";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

function getBedrockProvider() {
  return createAmazonBedrock({ credentialProvider: fromNodeProviderChain() });
}

/**
 * Parses a "provider/model" string into its parts.
 */
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

/**
 * Returns the configured LLM model.
 *
 * LLM_MODEL uses provider/model format:
 *   - "bedrock/us.amazon.nova-pro-v1:0"  (AWS Bedrock)
 *   - "openai/gpt-4o"                    (OpenAI)
 *   - "anthropic/claude-sonnet-4-5-20250514" (Anthropic)
 *   - "google/gemini-2.0-flash"          (Google)
 */
export function getMastraModel() {
  const { provider, modelName, raw } = parseModelId("LLM_MODEL");

  if (provider === "bedrock") {
    return getBedrockProvider()(modelName);
  }

  return { id: raw as `${string}/${string}` } satisfies OpenAICompatibleConfig;
}

/**
 * Returns the configured embedding model.
 *
 * EMBEDDING_MODEL uses the same provider/model format:
 *   - "bedrock/amazon.titan-embed-text-v2:0"
 *   - "openai/text-embedding-3-small"
 */
export function getMastraEmbeddingModel() {
  const { provider, modelName, raw } = parseModelId("EMBEDDING_MODEL");

  if (provider === "bedrock") {
    return getBedrockProvider().embedding(modelName);
  }

  return new ModelRouterEmbeddingModel(raw as `${string}/${string}`);
}
