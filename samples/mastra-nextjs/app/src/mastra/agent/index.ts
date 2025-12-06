import { Agent } from "@mastra/core/agent";
import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";

import { getMemory } from "../memory";
import { instructions } from "./instructions";
import { getFilePaths } from "../tools/getFilePaths";
import { getFileContent } from "../tools/getFileContent";
import { getRepositoryIssues } from "../tools/getRepositoryIssues";
import { getRepositoryCommits } from "../tools/getRepositoryCommits";
import { getRepositoryPullRequests } from "../tools/getRepositoryPullRequests";
import { getRepositoryStars } from "../tools/getRepositoryStars";

function makeModel(modelName: string, cloudProvider: string) {
  if (cloudProvider === "aws") {
    return createAmazonBedrock({
      credentialProvider: fromNodeProviderChain(),
    })(modelName);
  }

  if (cloudProvider === "gcp") {
    throw new Error("GCP provider is not implemented yet");
  }

  return null;
}

const bedrock = createAmazonBedrock({
  credentialProvider: fromNodeProviderChain(),
});

export const agent = new Agent({
  name: "agent",
  instructions,
  memory: getMemory,
  model: bedrock("us.amazon.nova-lite-v1:0"),
  tools: {
    getFilePaths,
    getFileContent,
    getRepositoryIssues,
    getRepositoryCommits,
    getRepositoryPullRequests,
    getRepositoryStars,
  },
});
