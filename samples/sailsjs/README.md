# Sailsjs

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-sailsjs-template%26template_owner%3DDefangSamples)

This sample demosntrates how to deploy a very basic Sailsjs sample with Defang. The sample simply outputs hello world on the webpage.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

## Development

For development, we use a local container. This can be seen in the compose.yaml document. To run the sample locally after cloning the respository, you can run on docker by using the following command:

1. docker compose -f compose.dev.yaml up --build

---

Title: Sails.js

Short Description: A short hello world application demonstrating how to deploy Sails.js onto Defang.

Tags: Sails.js, Node.js

Languages: nodejs
