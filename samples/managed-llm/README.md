# Managed LLM

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-managed-llm-template%26template_owner%3DDefangSamples)

This sample application demonstrates the use of OpenAI-compatible Managed LLMs (Large Language Models) with Defang.

The OpenAI-compatible managed LLM feature, provided by the Defang OpenAI Access Gateway, allows users to use AWS Bedrock or Google Cloud Vertex AI with an OpenAI compatible SDK. This enables switching from OpenAI to one of these cloud-native platforms without modifying your application code.

You can configure the `MODEL` and `ENDPOINT_URL` for the LLM separately for local development and production environments.
* The `MODEL` is the LLM Model ID you are using.
* The `ENDPOINT_URL` is the bridge that provides authenticated access to the LLM model. 

### Defang OpenAI Access Gateway

In the `compose.yaml` file, the `llm` service is used to route requests to the LLM API model. This is known as the Defang OpenAI Access Gateway. 

The `x-defang-llm` property on the `llm` service must be set to `true` in order to use the OpenAI Access Gateway when deploying with Defang.

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

### `MODEL`
The Model ID of the LLM you are using for your application. For example, `anthropic.claude-3-5-haiku-20241022-v1:0`.
```bash
defang config set MODEL
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

Title: Managed LLM

Short Description: An app using Managed LLMs with Defang's OpenAI Access Gateway.

Tags: LLM, OpenAI, Python, Bedrock, Vertex

Languages: Python
