# Mastra & Next.js & PostgreSQL & Redis

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-mastra-nextjs-postgres-redis-template%26template_owner%3DDefangSamples)

This sample shows how to deploy a multi-service Mastra application with Defang. It includes a Next.js customer-operations console, a Mastra-powered copilot, a BullMQ worker, PostgreSQL for durable state and memory, Redis for queues, and managed LLM services for both chat and embeddings in deployed environments.

The app models a concrete internal use case instead of a generic chat page. The fictional company is Sprintlane, an AI-powered project management startup that syncs Jira, GitHub, Slack, and docs into customer workspaces. The main page focuses on the customer-operations workflow for enterprise rollouts, planning-week spikes, and compliance-sensitive escalations, while the `/ops` page exposes architecture and runtime internals for technical demos.

## Features

- **Mastra agent** backed by tools that inspect tickets, documents, and recent activity
- **Queue-backed simulation + triage pipeline** using BullMQ and Redis
- **Durable state** in PostgreSQL for workspace docs, ticket metadata, job history, and Mastra memory
- **Managed AI access** via `x-defang-llm` for chat and embedding endpoints
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
- a background worker that runs timed ingest simulations and triage jobs

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

### `EMBEDDING_MODEL`

The embedding model identifier used for semantic triage search.

```bash
defang config set EMBEDDING_MODEL
```

PostgreSQL TLS is configured directly in `DATABASE_URL`:

- `compose.yaml` uses `uselibpqcompat=true&sslmode=require` for deployed environments (Cloud SQL compatible with pg v8).
- `compose.dev.yaml` uses `sslmode=disable` for local Docker Compose.

## Usage

1. Open the app.
2. Choose a seed profile, scale factor, and duration.
3. Click `Run live simulation` to enqueue a timed ingest run (default: 1 minute, every few seconds).
4. Wait for the worker to generate external events, queue triage jobs, classify each item with the LLM, and build the semantic search index.
5. Ask questions like:
   - `Which customer workspace should the on-call lead handle first?`
   - `Summarize the open Sprintlane incidents.`
   - `Find incidents similar to Jira import failures and recommend actions.`
   - `Which accounts are blocking the enterprise rollout?`
6. Open `/ops` when you want to show queue internals, service topology, and low-level runtime state.

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

Short Description: A multi-service Mastra customer-operations copilot for an AI project management startup, with background jobs, PostgreSQL, Redis, and managed LLM access.

Tags: Mastra, Next.js, PostgreSQL, Redis, BullMQ, AI, Agents, Project Management, Operations

Languages: TypeScript, JavaScript, Docker
