# n8n

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](ASK RAPH)

This sample shows how to get a [n8n](https://n8n.io/) app up using PostgreSQL as a database and running with Defang. The original sample can be found [here](https://github.com/n8n-io/n8n-hosting/tree/main/docker-compose/withPostgres). The official n8n guide for setting up with PostgreSQL [here](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/) does not work with Defang. To use the version compatible with Defang, please refer to this sample instead.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

**IMPORTANT:** But before you do that change the default users and passwords in the [`.env`](.env) file!

To run the application locally for development, use the development compose file:

```bash
docker compose -f compose.dev.yaml up
```

This will:

- Start PostgreSQL with volume persistence for local development
- Expose PostgreSQL on port 5432 for direct access if needed
- Start n8n on port 5678 with volume persistence
- Use the `init-data.sh` script to automatically set up the non-root database user

You can access n8n at `http://localhost:5678` once the containers are running.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_USER`

The username for your Postgres database. You need to set this before deploying for the first time.

### `POSTGRES_PASSWORD`

The password for your Postgres database. You need to set this before deploying for the first time.

### `POSTGRES_DB`

The name of your Postgres database. You need to set this before deploying for the first time.

### `POSTGRES_NON_ROOT_USER`

The non-root user for your Postgres database, it will be used in the service setup to setup non-root access for your Postgres database. It is also used in the script called `init-data.sh`. You need to set this before deploying for the first time.

### `POSTGRES_NON_ROOT_PASSWORD`

The POSTGRES_NON_ROOT_USER's password for your Postgres database, it will be used in the service setup to setup non-root access for your Postgres database. It is also used in the script called `init-data.sh`. You need to set this before deploying for the first time.

## Deployment

The project includes two compose files:

- **`compose.dev.yaml`** - For local development with volume persistence and port exposure
- **`compose.yaml`** - For cloud deployment (extends `compose.dev.yaml` with cloud-specific optimizations)

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:

```bash
defang compose up
```

This will use `compose.yaml` which extends `compose.dev.yaml` but:

- Removes volume mounts (not supported by Defang)
- Removes PostgreSQL port exposure for security
- Adds a `setup` service to initialize the database with proper user permissions
- Optimizes environment variables for cloud deployment

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
   ```bash
   defang --provider=aws compose up
   ```

---

Title: n8n

Short Description: A n8n app running on Defang.

Tags: n8n, PostgreSQL, Docker

Languages: Docker, Shell
