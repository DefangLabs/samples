# n8n

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-n8n-template%26template_owner%3DDefangSamples)

This sample shows how to get a [n8n](https://n8n.io/) app up using PostgreSQL as a database and running with Defang. We based it in part on the [original sample](https://github.com/n8n-io/n8n-hosting/tree/main/docker-compose/withPostgres) from the n8n team, but we have adapted it to be consistent with the way our other samples are configured.

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

You can access n8n at `http://localhost:5678` once the containers are running.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`

The password for your Postgres database. You need to set this before deploying for the first time.

*You can easily set this to a random string using `defang config set POSTGRES_PASSWORD --random`*

### `N8N_ENCRYPTION_KEY`

The encryption key for your n8n instance. This is used to encrypt sensitive data in the database. 

*You can easily set this to a random string using `defang config set N8N_ENCRYPTION_KEY --random`*

### `DB_POSTGRESDB_SSL_ENABLED`

Set to `true` to enable SSL. Set to `false` to disable SSL.

### `DB_POSTGRESDB_SSL_REJECT_UNAUTHORIZED`

Set to `true` to reject unauthorized certificates. Set to `false` to accept unauthorized certificates. Counterintuitive, but leave this as **true** to **disable SSL** (required for local dev and playground).


## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:

```bash
defang compose up
```

### BYOC (Deploy to you own AWS or GCP cloud account)

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

> [!NOTE]
> This project spins up a managed database when deploying to your own cloud. It may take upwards of 25 minutes for your deployment to complete, please be patient.

---

Title: n8n

Short Description: A n8n app running on Defang.

Tags: n8n, PostgreSQL, Docker

Languages: Docker, Shell
