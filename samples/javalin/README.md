# Javalin Sample

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

For development, we use a local container. This can be seen in the compose.yaml document. To make changes to this sample, make sure that you have `openjdk@17` and `maven` installed. To run the sample locally after cloning the repository, you can run it on Docker by using the following command:

1. Navigate to the `app` directory and build the project:

   ```bash
   cd app
   mvn clean package
   cd ../
   ```

2. From the project root directory, run:

   ```bash
   docker compose up --build
   ```

---

Title: Javalin

Short Description: A short hello world application demonstrating how to deploy Javalin onto defang.

Tags: Javalin & Java & Maven

Languages: java, javalin
