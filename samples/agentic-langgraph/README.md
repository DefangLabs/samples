# Agentic LangGraph

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-agentic-langgraph-template%26template_owner%3DDefangSamples)

This sample demonstrates a LangGraph Agent application deployed with Defang. You can customize the agent's tools as needed. For example, it includes a Tavily Search tool for performing search queries, which requires a `TAVILY_API_KEY` (see [Configuration](#configuration) for setup details).

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up --build
```

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `TAVILY_API_KEY`
A Tavily API key for accessing Tavily Search. 
```bash
defang config set TAVILY_API_KEY
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

---

Title: Agentic LangGraph

Short Description: A LangGraph Agent application that can use tools, deployed with Defang. 

Tags: Agent, LangGraph, LangChain, AI, OpenAI, Tavily

Languages: TypeScript
