# Mastra & Next.js & PostgreSQL & Redis

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-mastra-nextjs-postgres-redis-template%26template_owner%3DDefangSamples)

This sample shows how to deploy a multi-service Mastra application with Defang. It includes a Next.js dashboard, a Mastra-powered support and ops copilot, a BullMQ worker, PostgreSQL for durable state and memory, Redis for queues, and a managed LLM service for deployed environments.

The app models a realistic internal AI tool instead of a single chat page. You can queue a workspace sync job, inspect ticket and activity data, and ask the copilot to summarize incidents, draft release notes, or identify the highest-priority work.

## Features

- **Mastra agent** backed by tools that inspect tickets, documents, and recent activity
- **Queue-backed background sync** using BullMQ and Redis
- **Durable state** in PostgreSQL for workspace docs, ticket metadata, job history, and Mastra memory
- **Managed AI access** via `x-defang-llm` for deployment to AWS or GCP
- **Local mock mode** so the sample is still usable with plain Docker Compose during development

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, use the development compose file:

```bash
docker compose -f compose.dev.yaml up --build
```

This starts:

- the Next.js app on `http://localhost:3000`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- a background worker that processes workspace sync jobs

Local development defaults to `MOCK_AGENT=true`, which means the dashboard and background sync are fully functional without any cloud model credentials.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration):

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`

The password for the PostgreSQL database.

```bash
defang config set POSTGRES_PASSWORD --random
```

### `LLM_MODEL`

The model identifier to use in deployed mode. For Defang Playground this should be a lightweight chat model. For BYOC it can be a Bedrock or Vertex-supported model.

```bash
defang config set LLM_MODEL
```

### `DB_SSL`

Set to `true` for AWS and GCP managed PostgreSQL. Set to `false` for Defang Playground.

```bash
defang config set DB_SSL
```

## Usage

1. Open the dashboard.
2. Click `Sync sample workspace` to enqueue a background sync job.
3. Wait for the worker to load the sample tickets, runbooks, and release activity.
4. Ask questions like:
   - `What should the on-call engineer look at first?`
   - `Summarize the open incidents.`
   - `Draft release notes from the latest activity.`
   - `Which tickets are blocking the launch?`

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:

```bash
defang compose up
```

### BYOC

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

---

Title: Mastra & Next.js & PostgreSQL & Redis

Short Description: A multi-service Mastra support and ops copilot with background jobs, PostgreSQL, Redis, and managed LLM access.

Tags: Mastra, Next.js, PostgreSQL, Redis, BullMQ, AI, Agents, Support, Operations

Languages: TypeScript, JavaScript, Docker
