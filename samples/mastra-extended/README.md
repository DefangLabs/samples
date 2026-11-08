# Mastra Extended

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.io/sample/mastra-extended)

This sample shows a multi-service AI app built with [Mastra](https://mastra.ai/), Next.js, PostgreSQL (with pgvector), Redis, and BullMQ, deployed with Defang from a single Docker Compose file.

A background worker generates sample tasks and events with an LLM, pushes them to a queue, then they get classified and stored with vector embeddings in PostgreSQL for semantic search. A Mastra-powered chat agent uses tools to inspect the current state before answering questions.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally for development, use the development compose file:

```bash
docker compose -f compose.dev.yaml up --build
```

This will:

- Start the Next.js app on `http://localhost:3000`
- Start PostgreSQL on port 5432
- Start Redis on port 6379
- Start a background worker for item classification
- Start Docker model-provider services for chat + embeddings

Local development uses:

- `ai/qwen2.5:3B-Q4_K_M` for chat/tool-calling
- `mxbai-embed-large` for embeddings

This matches the CrewAI sample's local model setup and relies on Docker Model Runner / model-provider support being available in your local Docker installation. The first run will download both models, so startup can take a few minutes.
If `docker compose -f compose.dev.yaml up` fails with `exec: "model": executable file not found in $PATH`, your local Docker installation does not have Docker Model Runner enabled yet.
To keep iteration practical on CPU-only setups, `compose.dev.yaml` enables `LOCAL_FAST_DATA=true`, which uses deterministic sample generation and classification locally while still exercising the real chat and embedding services.

In deployed environments, the app uses dedicated `chat` and `embedding` model services defined in `compose.yaml`. Defang injects OpenAI-compatible `CHAT_URL` / `CHAT_MODEL` and `EMBEDDING_URL` / `EMBEDDING_MODEL` environment variables automatically, so the application code stays platform-independent.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`

The password for your PostgreSQL database. You need to set this before deploying for the first time.

*You can easily set this to a random string using `defang config set POSTGRES_PASSWORD --random`*

### Scaleway inference key

On Scaleway, Defang uses an `OPENAI_API_KEY` you have configured, or reuses your authenticated Scaleway API key when none is set. To supply a separate key:

```bash
defang config set OPENAI_API_KEY
```

Keep this key out of the recipe files.

## Usage

1. Open the app.
2. Click **Generate sample items**.
3. Watch the worker create 10 tasks and 10 events, then fan out per-item classify/embed jobs (progress updates in real time via SSE).
4. Ask questions like:
   - `What should I look at first?`
   - `Summarize the tasks and events.`
   - `Which items seem related?`
   - `Find events similar to the deploy rollback.`

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Deploy to your cloud account

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

The sample uses portable Compose model aliases:

- `chat` uses `chat-default`
- `embedding` uses `embedding-default`

### Choose models with a recipe

Start from your stack's current recipe in the Defang Portal. Copy the model entries from the matching example into its `config` section, keeping the other infrastructure settings you want to retain:

| Cloud | Model settings |
| --- | --- |
| AWS Bedrock | [recipes/aws.yaml](./recipes/aws.yaml) |
| GCP Vertex AI | [recipes/gcp.yaml](./recipes/gcp.yaml) |
| Microsoft Foundry on Azure | [recipes/azure.yaml](./recipes/azure.yaml) |
| Scaleway Generative APIs | [recipes/scaleway.yaml](./recipes/scaleway.yaml) |

Assign the custom recipe to the stack and deploy with `defang compose up`. The base Compose file continues to use `chat-default` and `embedding-default`; the recipe controls the cloud choices. These examples require compatible CLI and deployment-engine releases.

The AWS example omits the chat model's exact revision. Azure omits the chat revision while specifying an exact embedding revision separately. Scaleway defines a family key without a release suffix and maps it to a concrete model ID. GCP uses its native model names; those names can remain mutable upstream.

You can also select a family directly. With the Scaleway example recipe assigned to the stack, add this non-secret setting to a local `.env` file in the sample directory:

```dotenv
CHAT_MODEL=qwen3-235b-a22b-instruct
```

Then run `defang compose up`. `CHAT_MODEL` and `EMBEDDING_MODEL` are read from `.env` when Compose loads. Defang does not use arbitrary shell environment values or `defang config set` to substitute these model names.

Keep the embedding model stable once the app has stored vectors. Changing it can require regenerating those vectors, even when the dimensions match. A recipe default change preserves an existing embedding selection; request a new exact model or a distinct recipe key pinned to it when you are ready to migrate.

> [!WARNING]
> **Extended deployment time:** This sample creates a managed PostgreSQL database which may take upwards of 20 minutes to provision on first deployment. Subsequent deployments are much faster (2-5 minutes).

---

Title: Mastra Extended

Short Description: A small Defang sample where background jobs classify and embed tasks and events, and a Mastra copilot answers questions with tools.

Tags: Mastra, Next.js, PostgreSQL, Redis, BullMQ, AI, Agents, sample

Languages: TypeScript, JavaScript, Docker
