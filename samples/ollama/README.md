# Ollama

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-ollama-template%26template_owner%3DDefangSamples)

This sample demonstrates how to deploy [Ollama](https://ollama.com/) with Defang, along with a Next.js frontend using the [AI SDK](https://www.npmjs.com/package/ai) for smooth streaming conversations. By default it runs a very small model (`llama3.2:1b`) which can perform well with just a CPU, but we've included lines that you can uncomment in the compose file to enable GPU support and run a larger model like `gemma:7b`. If you want to deploy to a GPU powered instance, you will need to use your own AWS account with [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc).

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the defang playground by opening up your terminal and typing `defang up`.

**Keep in mind that the playground does not support GPU instances.**

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run `defang up` in a terminal that has access to your AWS environment variables.

---

Title: Ollama

Short Description: Ollama is a tool that lets you easily run large language models.

Tags: AI, LLM, ML, Llama, Mistral, Next.js, AI SDK, 

Languages: Typescript
