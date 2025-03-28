# Langchain & Flask

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-langchain-template%26template_owner%3DDefangSamples)

This sample is an endpoint that tells programming jokes and shows how to deploy a flask app that uses Langchain on to AWS via Defang.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Deploying

1. Open the terminal and type `defang login`
2. Set the environment variable `OPENAI_KEY` by typing `defang config set OPENAI_KEY`.
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

## Development

For development, first clone the project and navigate to its directory. After such, please run the command

```
docker compose up --build
```

This will start a Docker container with the flask app which will display the result of the langchain prompt.

---

Title: LangChain & Flask

Short Description: A sample project demonstrating how to deploy LangChain with Flask on Defang.

Tags: LangChain, Flask, AI, Python

Languages: python
