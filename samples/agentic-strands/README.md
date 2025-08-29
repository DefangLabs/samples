# Agentic Strands

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-agentic-strands-template%26template_owner%3DDefangSamples)

This sample demonstrates a Strands Agent application, deployed with Defang. This [Strands](https://strandsagents.com/latest/) Agent can use tools, and is compatible with the [Defang OpenAI Access Gateway](https://github.com/DefangLabs/openai-access-gateway/).

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

For this sample, you will not need to provide any [configuration](https://docs.defang.io/docs/concepts/configuration). However, if you ever need to, below is an example of how to do so in Defang:

```bash
defang config set API_KEY
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

Title: Agentic Strands

Short Description: A Strands Agent application, deployed with Defang.

Tags: Python, Flask, Strands, AI, Agent

Languages: Python
