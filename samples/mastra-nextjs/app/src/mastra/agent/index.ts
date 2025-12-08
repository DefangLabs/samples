import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import type { LanguageModelV2 } from "@ai-sdk/provider";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { createVertex } from "@ai-sdk/google-vertex";

import { getMemory } from "../memory";
import { instructions } from "./instructions";
import { getFilePaths } from "../tools/getFilePaths";
import { getFileContent } from "../tools/getFileContent";
import { getRepositoryIssues } from "../tools/getRepositoryIssues";
import { getRepositoryCommits } from "../tools/getRepositoryCommits";
import { getRepositoryPullRequests } from "../tools/getRepositoryPullRequests";
import { getRepositoryStars } from "../tools/getRepositoryStars";

// https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#using-aws-sdk-credentials-chain-instance-profiles-instance-roles-ecs-roles-eks-service-accounts-etc
function createAWSModelProvider(modelName: string): LanguageModelV2 {
  return createAmazonBedrock({
    credentialProvider: fromNodeProviderChain(),
  })(modelName);
}

// https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex
function createGCPModelProvider(modelName: string): LanguageModelV2 {
  const projectId = process.env.DEFANG_GCP_PROJECT;
  if (projectId === undefined) {
    throw new Error(
      "DEFANG_GCP_PROJECT is not defined in environment variables"
    );
  }
  const location = process.env.DEFANG_GCP_LOCATION;
  if (location === undefined) {
    throw new Error(
      "DEFANG_GCP_LOCATION is not defined in environment variables"
    );
  }
  return createVertex({
    project: projectId,
    location: location,
  })(modelName);
}

function getModel(): LanguageModelV2 {
  const provider = process.env.DEFANG_PROVIDER;
  const modelName = process.env.LLM_MODEL;
  if (modelName === undefined) {
    throw new Error("LLM_MODEL is not defined in environment variables");
  }

  if (provider === "aws") {
    return createAWSModelProvider(modelName);
  }

  if (provider === "gcp") {
    return createGCPModelProvider(modelName);
  }

  throw new Error(`Unsupported DEFANG_PROVIDER: ${provider}`);
}

export const agent = new Agent({
  name: "agent",
  instructions,
  memory: getMemory,
  model: getModel,
  tools: {
    getFilePaths,
    getFileContent,
    getRepositoryIssues,
    getRepositoryCommits,
    getRepositoryPullRequests,
    getRepositoryStars,
  },
});
