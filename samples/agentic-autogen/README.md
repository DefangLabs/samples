# Agentic Autogen

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-agentic-autogen-template%26template_owner%3DDefangSamples)

This sample shows an agentic Autogen application using Mistral and FastAPI, deployed with Defang. For demonstration purposes, it will require a [Mistral AI](https://mistral.ai/) API key (see [Configuration](#configuration) for more details). However, you are free to modify it to use a different LLM, say the [Defang OpenAI Access Gateway](https://github.com/DefangLabs/openai-access-gateway/) service, as an alternative. Note that the Vite React frontend is served through the FastAPI backend so that they can be treated as one service in production.
 
## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose up --build
```

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `MISTRAL_API_KEY`
An API key to access the [Mistral AI API](https://mistral.ai/).
```bash
defang config set MISTRAL_API_KEY
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

Title: Agentic Autogen

Short Description: An Autogen agent application using Mistral and FastAPI, deployed with Defang.

Tags: Agent, Autogen, Mistral, FastAPI, Vite, React, Python, JavaScript, AI

Languages: Python, JavaScript
