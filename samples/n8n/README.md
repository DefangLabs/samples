# n8n

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](ASK RAPH)

This sample shows how to get a [n8n](https://n8n.io/) app up using PostgreSQL as a database and running with Defang. The original sample can be found [here](https://github.com/n8n-io/n8n-hosting/tree/main/docker-compose/withPostgres). The official n8n guide for setting up with PostgreSQL [here](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/) does not work with Defang. The reason the sample does not work is because it relies on certain Docker features that are not supported by Defang, which are volumes. To use the version compatible with Defang, please refer to this sample instead.

This sample demonstrates how to run an [n8n](https://n8n.io/) app with PostgreSQL as the database using Defang. The original sample can be found [here](https://github.com/n8n-io/n8n-hosting/tree/main/docker-compose/withPostgres). However, the official n8n [guide](https://docs.n8n.io/hosting/installation/server-setups/docker-compose/) for setting up with PostgreSQL is not compatible with Defang. The incompatibility comes from its reliance on Docker volumes feature not supported by Defang. To use a version that works with Defang, please refer to this sample instead.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

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

- **`compose.dev.yaml`** - For local development with volume persistence
- **`compose.yaml`** - For cloud deployment with Defang

### Important Notes

> Download [Defang CLI](https://github.com/DefangLabs/defang)
> When you deploy to Defang for the first time, the managed PostgreSQL may take up to 10 minutes to be ready. The `init-data.sh` script includes retry logic to handle this delay. If the initialization fails after all attempts, please redeploy your application again as the managed PostgreSQL may be ready on the next deployment.

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:

```bash
defang compose up
```

### BYOC

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

---

Title: n8n

Short Description: A n8n app running on Defang.

Tags: n8n, PostgreSQL, Docker

Languages: Docker, Shell
