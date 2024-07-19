# Sailsjs

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

Title: Sailsjs

Short Description: A short hello world application demosntrating how to deploy Sailsjs onto defang.

Tags: Sailsjs

Languages: Node.js, JavaScript
