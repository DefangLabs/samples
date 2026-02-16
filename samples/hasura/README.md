# Hasura & PostgreSQL

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-hasura-template%26template_owner%3DDefangSamples)

This sample project demonstrates how to deploy Hasura with Defang and connect it to a Postgres database. 

The sample populates the database with some sample data so you can quickly start playing with the Hasura console. It sets wide open permissions on the tables as well so you can start querying or mutating the data right away.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)
Comment view5. (Optional) Install the [Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/) to create migrations and update metadata for your Hasura GraphQL API

## Development

 To run the application locally, you can use the following command:

```bash
docker compose -f ./compose.yaml -f ./compose.dev.yaml up --build
```
This will start the Postgres container (from `compose.dev.yaml`) and the Hasura container (from `compose.yaml` with some overrides). The Hasura console will be available at `http://localhost:8080` with the password `password`.

> Note: If you want to make changes to your database, permissions, etc. see [Editing Hasura Settings](#editing-hasura-settings).

### Editing Hasura Settings

To edit the database, permissions, or any other Hasura settings such that you can deploy them to production, you should install the [ Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/). Then, after starting the development environment, you can run `hasura console` _inside the `./hasura` directory_. This will open the Hasura console in your browser. Any changes you make in the console will be saved to the `migrations` and `metadata` directories. When you run `defang compose up`, these changes will be applied to the production environment.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD` 
A password for your database.
```bash
defang config set POSTGRES_PASSWORD
```

### `SSL_MODE` 
Either `disable` if you're using the Defang Playground or `require` if you're using BYOC. 
```bash
defang config set SSL_MODE
```

### `HASURA_GRAPHQL_ADMIN_SECRET`
A password you would like to log into Hasura with. 
```bash
defang config set HASURA_GRAPHQL_ADMIN_SECRET
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
    ```bash
    defang --provider=aws compose up
    ```

---

Title: Hasura & PostgreSQL

Short Description: A sample project demonstrating how to deploy Hasura with Defang and connect it to a PostgreSQL database.

Tags: Hasura, GraphQL, PostgreSQL, Database

Languages: SQL, GraphQL
