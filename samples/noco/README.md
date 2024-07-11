# NocoDB

This sample demosntrates how to deploy a Nocodb instance with Defang. It takes you to the Nocodb web page for registration.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

## Development

For development, we use a local container. This can be seen in the compose.yaml document. To run the sample locally after cloning the respository, you can simply run the following command:

1. `docker compose up --build`

---

Title: NocoDB

Short Description: A User Interface by Nocodb

Tags: NocoDB

Languages: NocoDB, Docker
