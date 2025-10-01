# Hasura & PostgreSQL

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-hasura-template%26template_owner%3DDefangSamples)

This sample project demonstrates how to deploy Hasura with Defang and connect it to a Postgres database. We also demonstrate how to run a Postgres container during development and how to switch over to a managed postgres service like RDS, Neon, or others in production. If you want to get a compatible database ready to go really quickly for free, [Neon](https://neon.tech/) is a quick and easy way to go. The sample populates the database with some sample data so you can quickly start playing with the Hasura console. It sets wide open permissions on the tables as well so you can start querying or mutating the data right away.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)
4. (Optional) [Install the Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/) to create migrations and update metadata for your Hasura GraphQL api.

## Development

To start the development environment, run `docker -f ./compose.dev.yaml up`. This will start the Postgres container and the Hasura container. The Hasura console will be available at `http://localhost:8080` with the password `password`.
**Note:** _If you want to make changes to your database, permissions, etc. you should use the Hasura console and the Hasura CLI to make those changes. See the next section for more information._

### Editing the database/permissions etc.

If you want to edit the database, permissions, or any other Hasura settings such that you can deploy them to production, you should [install the Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/). Then, after starting the development environment, you can run `hasura console` _inside the `./hasura` directory_. This will open the Hasura console in your browser. Any changes you make in the console will be saved to the `migrations` and `metadata` directories. When you run `defang compose up` these changes will be applied to the production environment.

**NOTE**: If you are using the [Dev Container](https://containers.dev/) defined in [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json), the Hasura CLI will already be installed.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `HASURA_GRAPHQL_ADMIN_SECRET`
This password will be used to allow you to access the hasura console. 


### `POSTGRES_PASSWORD`
This password will be used to initialize the PostgreSQL database and to connect to it. You could use a command like `openssl rand -base64 16` to generate a random password.


## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the defang playground by opening up your terminal and typing `defang up`.

**Keep in mind that the playground does not support [managed Postgres](https://docs.defang.io/docs/concepts/managed-storage/managed-postgres).**

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run `defang --provider=aws up` in a terminal that has access to your AWS environment variables.


---

Title: Hasura & PostgreSQL

Short Description: A sample project demonstrating how to deploy Hasura with Defang and connect it to a PostgreSQL database.

Tags: Hasura, GraphQL, PostgreSQL, Database

Languages: SQL, GraphQL
