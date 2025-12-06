import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
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

function AWSModelProvider(modelName: string) {
  return createAmazonBedrock({
    credentialProvider: fromNodeProviderChain(),
  })(modelName);
}

function GCPModelProvider(model: string) {
  return createVertex({
    project: "cloudbuildtest-468719",
    location: "us-central1",
  })(model);
}

export const agent = new Agent({
  name: "agent",
  instructions,
  memory: getMemory,
  model:
    process.env.DEFANG_PROVIDER === "aws"
      ? AWSModelProvider(process.env.LLM_MODEL || "us.amazon.nova-lite-v1:0")
      : GCPModelProvider(process.env.LLM_MODEL || "gemini-2.5-pro"),
  tools: {
    getFilePaths,
    getFileContent,
    getRepositoryIssues,
    getRepositoryCommits,
    getRepositoryPullRequests,
    getRepositoryStars,
  },
});
