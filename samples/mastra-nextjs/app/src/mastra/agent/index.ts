import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { vertex } from "@ai-sdk/google-vertex";

import { getMemory } from "../memory";
import { instructions } from "./instructions";
import { getFilePaths } from "../tools/getFilePaths";
import { getFileContent } from "../tools/getFileContent";
import { getRepositoryIssues } from "../tools/getRepositoryIssues";
import { getRepositoryCommits } from "../tools/getRepositoryCommits";
import { getRepositoryPullRequests } from "../tools/getRepositoryPullRequests";
import { getRepositoryStars } from "../tools/getRepositoryStars";

function getModel() {
  const modelName = process.env.LLM_MODEL;
  if (modelName === undefined) {
    throw new Error("LLM_MODEL is not defined in environment variables");
  }

  if (process.env.AWS_REGION) {
    // https://ai-sdk.dev/providers/ai-sdk-providers/amazon-bedrock#using-aws-sdk-credentials-chain-instance-profiles-instance-roles-ecs-roles-eks-service-accounts-etc
    return createAmazonBedrock({
      credentialProvider: fromNodeProviderChain(),
    })(modelName);
  } else if (process.env.GOOGLE_VERTEX_LOCATION) {
    // https://ai-sdk.dev/providers/ai-sdk-providers/google-vertex
    return vertex(modelName);
  }

  // https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
  return modelName;
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
