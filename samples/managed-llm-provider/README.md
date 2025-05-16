# Managed LLM with Docker Model Provider

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-managed-llm-provider-template%26template_owner%3DDefangSamples)

This sample application demonstrates using Managed LLMs with a Docker Model Provider, deployed with Defang.

> Note: This version uses a [Docker Model Provider](https://docs.docker.com/compose/how-tos/model-runner/#provider-services) for managing LLMs. For the version with Defang's [OpenAI Access Gateway](https://docs.defang.io/docs/concepts/managed-llms/openai-access-gateway), please see our [*Managed LLM Sample*](https://github.com/DefangLabs/samples/tree/main/samples/managed-llm) instead.

The Docker Model Provider allows users to use AWS Bedrock or Google Cloud Vertex AI models with their application. It is a service in the `compose.yaml` file.

You can configure the `MODEL` and `ENDPOINT_URL` for the LLM separately for local development and production environments.
* The `MODEL` is the LLM Model ID you are using.
* The `ENDPOINT_URL` is the bridge that provides authenticated access to the LLM model. 

Ensure you have the necessary permissions to access the model you intend to use. To do this, you can check your [AWS Bedrock model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html) or [GCP Vertex AI model access](https://cloud.google.com/vertex-ai/generative-ai/docs/control-model-access).

### Docker Model Provider

In the `compose.yaml` file, the `llm` service will route requests to the LLM API model using a [Docker Model Provider](https://docs.defang.io/docs/concepts/managed-llms/openai-access-gateway#docker-model-provider-services).

The `x-defang-llm` property on the `llm` service must be set to `true` in order to use the Docker Model Provider when deploying with Defang.

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
The Model ID of the LLM you are using for your application. For example, `anthropic.claude-3-5-sonnet-20241022-v2:0`.
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

Title: Managed LLM with Docker Model Provider

Short Description: An app using Managed LLMs with a Docker Model Provider, deployed with Defang.

Tags: LLM, Python, Bedrock, Vertex, Docker Model Provider

Languages: Python
