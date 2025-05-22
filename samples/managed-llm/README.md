# Managed LLM

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-managed-llm-template%26template_owner%3DDefangSamples)

This sample application demonstrates the use of OpenAI-compatible Managed LLMs (Large Language Models) with Defang.


> Note: Using Docker Model Provider? See our [*Managed LLM with Docker Model Provider*](https://github.com/DefangLabs/samples/tree/main/samples/managed-llm-provider) sample.

Using the [Defang OpenAI Access Gateway](#defang-openai-access-gateway), the feature `x-defang-llm: true` enables you to use Managed LLMs on the Defang Playground or on platforms offered by BYOC providers (such as AWS Bedrock or GCP Vertex AI) with an OpenAI-compatible SDK.

This allows switching from OpenAI to the Managed LLMs on supported cloud platforms without modifying your application code.

You can configure the `MODEL` and `ENDPOINT_URL` for the LLM separately for local development and production environments.
* The `MODEL` is the LLM Model ID you are using.
* The `ENDPOINT_URL` is the bridge that provides authenticated access to the LLM model. 

Ensure you have enabled model access for the model you intend to use. To do this, you can check your [AWS Bedrock model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access-modify.html) or [GCP Vertex AI model access](https://cloud.google.com/vertex-ai/generative-ai/docs/control-model-access).

To learn about available LLM models in Defang, please see our [Model Mapping documentation](https://docs.defang.io/docs/concepts/managed-llms/openai-access-gateway#model-mapping). 

For more about Managed LLMs in Defang, please see our [Managed LLMs documentation](https://docs.defang.io/docs/concepts/managed-llms/managed-language-models).

### Defang OpenAI Access Gateway

In the `compose.yaml` file, the `llm` service is used to route requests to the LLM API model. This is known as the [Defang OpenAI Access Gateway](https://docs.defang.io/docs/concepts/managed-llms/openai-access-gateway). 

The `x-defang-llm` property on the `llm` service must be set to `true` in order to use the OpenAI Access Gateway when deploying with Defang.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.local.yaml up --build
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
