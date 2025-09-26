# Javalin Sample

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-javalin-template%26template_owner%3DDefangSamples)

This sample demonstrates how to deploy a very basic Javalin sample with Defang. The sample simply outputs "Defang x Javalin" on the webpage.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

## Development

For development, we use a local container. This can be seen in the compose.yaml file. To run the sample locally use the following command:

```bash
docker compose up --build
```

---

Title: Javalin

Short Description: A short hello world application demonstrating how to deploy Javalin onto Defang.

Tags: Javalin, Java, Maven

Languages: java
