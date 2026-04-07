import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import type { OpenAICompatibleConfig } from "@mastra/core/llm";

declare global {
  // eslint-disable-next-line no-var
  var bedrockProvider:
    | ReturnType<typeof createAmazonBedrock>
    | undefined;
}

function getConfiguredModelName() {
  const modelName = process.env.LLM_MODEL;
  if (!modelName) {
    throw new Error("LLM_MODEL is not configured");
  }

  return modelName;
}

export function isAwsBedrockRuntime() {
  return Boolean(
    process.env.AWS_REGION ||
      process.env.AWS_DEFAULT_REGION ||
      process.env.AWS_BEARER_TOKEN_BEDROCK ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
      process.env.ECS_CONTAINER_METADATA_URI_V4,
  );
}

function getBedrockProvider() {
  if (!global.bedrockProvider) {
    global.bedrockProvider = createAmazonBedrock({
      credentialProvider: fromNodeProviderChain(),
    });
  }

  return global.bedrockProvider;
}

export function getDirectBedrockModel(modelName = getConfiguredModelName()) {
  return getBedrockProvider()(modelName);
}

export function getMastraModel(): ReturnType<typeof getDirectBedrockModel> | OpenAICompatibleConfig {
  const modelName = getConfiguredModelName();

  if (isAwsBedrockRuntime()) {
    return getDirectBedrockModel(modelName);
  }

  return {
    providerId: "openai",
    modelId: modelName,
    apiKey: process.env.OPENAI_API_KEY ?? "defang",
    url: process.env.LLM_BASE_URL ?? "https://api.openai.com/v1",
  };
}
