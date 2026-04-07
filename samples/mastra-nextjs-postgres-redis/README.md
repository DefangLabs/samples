# Mastra & Next.js & PostgreSQL & Redis

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-mastra-nextjs-postgres-redis-template%26template_owner%3DDefangSamples)

This sample shows a small multi-service Defang app built with Next.js, Mastra, PostgreSQL, Redis, and BullMQ.

The app keeps the story simple:

- there are tasks
- there are events
- a background worker classifies and embeds them
- a chat agent uses tools to inspect the current state before it answers

## Features

- **One-click sample data generation** that creates 10 tasks and 10 events
- **Fan-out background processing** with BullMQ so each item is classified and embedded independently
- **PostgreSQL state** for items plus Mastra memory
- **Redis queue** for the batch job and per-item jobs
- **Mastra tools** for tasks, events, and semantic search
- **Managed LLM + embedding endpoints** for deployed environments

## Development

Run the app locally with Docker Compose:

```bash
docker compose -f compose.dev.yaml up --build
```

This starts:

- the Next.js app on `http://localhost:3000`
- PostgreSQL on `localhost:5432`
- Redis on `localhost:6379`
- a background worker

Local development defaults to `MOCK_AGENT=true`, so the UI still works without cloud model credentials.

## Configuration

### `POSTGRES_PASSWORD`

The password for the PostgreSQL database.

```bash
defang config set POSTGRES_PASSWORD --random
```

### `LLM_MODEL`

The model used for item generation, per-item classification, and the Mastra chat agent.

```bash
defang config set LLM_MODEL
```

### `EMBEDDING_MODEL`

The embedding model used for semantic search.

```bash
defang config set EMBEDDING_MODEL
```

PostgreSQL TLS is configured directly in `DATABASE_URL`:

- `compose.yaml` uses `uselibpqcompat=true&sslmode=require`
- `compose.dev.yaml` uses `sslmode=disable`

## Usage

1. Open the app.
2. Click `Generate sample items`.
3. Wait for the worker to create 10 tasks and 10 events, then fan out per-item classify/embed jobs.
4. Ask questions like:
   - `What should I look at first?`
   - `Summarize the tasks and events.`
   - `Which items seem related?`
   - `Find events similar to the deploy rollback.`

## Deployment

Deploy with Defang:

```bash
defang compose up
```

---

Title: Mastra & Next.js & PostgreSQL & Redis

Short Description: A small Defang sample where background jobs classify and embed tasks and events, and a Mastra copilot answers questions with tools.

Tags: Mastra, Next.js, PostgreSQL, Redis, BullMQ, AI, Agents

Languages: TypeScript, JavaScript, Docker
