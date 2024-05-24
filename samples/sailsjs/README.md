# Sailsjs

This sample demosntrates how to deploy a very basic Sailsjs sample with Defang. The sample simply outputs hello world on the webpage.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. Have a managed database service configured and have the connection string ready.
3. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
4. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

For development, we use a local container. This can be seen in the compose.yml document. To run the sample locally after clonging the respository, you can run on docker by doing _docker compose up --build_ or run without using Docker by doing the following:

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

---

Title: Sailsjs

Short Description: A short hello world application demosntrating how to deploy Sailsjs onto defang.

Tags: Sailsjs

Languages: nodejs, javascript
