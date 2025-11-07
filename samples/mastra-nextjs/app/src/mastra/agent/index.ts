import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

import { memory } from "../memory";
import { instructions } from "./instructions";
import { getFilePaths } from "../tools/getFilePaths";
import { getFileContent } from "../tools/getFileContent";
import { getRepositoryIssues } from "../tools/getRepositoryIssues";
import { getRepositoryCommits } from "../tools/getRepositoryCommits";
import { getRepositoryPullRequests } from "../tools/getRepositoryPullRequests";

export const agent = new Agent({
  name: "agent",
  instructions,
  //@ts-expect-error incompatible logger types
  memory,
  model: google("gemini-2.0-flash-001"),
  tools: {
    getFilePaths,
    getFileContent,
    getRepositoryIssues,
    getRepositoryCommits,
    getRepositoryPullRequests,
  },
});
