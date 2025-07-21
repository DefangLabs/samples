# Crew.ai Advanced Django Sample

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-crew-django-redis-postgres-template%26template_owner%3DDefangSamples)

This sample builds upon the basic CrewAI example and demonstrates a
multi-agent workflow.  A lightweight classifier determines whether the user is
requesting a summary, a deeper research answer or a translation.  Depending on
the decision different agents – powered by multiple LLM sizes – are executed
and the progress is streamed back to the browser using Django Channels.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f ./compose.local.yaml up --build
```

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`     
The password for the Postgres database.
```bash
defang config set POSTGRES_PASSWORD
```

### `SSL_MODE`

The SSL mode for the Postgres database.
```bash
defang config set SSL_MODE
```

### `DJANGO_SECRET_KEY`

The secret key for the Django application.
```bash
defang config set DJANGO_SECRET_KEY
```

### LLM configuration

Three different LLM endpoints are used to demonstrate branching.  Configure them via:

```bash
defang config set SMALL_LLM_URL
defang config set SMALL_LLM_MODEL
defang config set MEDIUM_LLM_URL
defang config set MEDIUM_LLM_MODEL
defang config set LARGE_LLM_URL
defang config set LARGE_LLM_MODEL
```

In addition the embedding model is configured with `EMBEDDING_URL` and `EMBEDDING_MODEL`.

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

Title: Crew.ai Advanced Django Sample

Short Description: Demonstrates branching CrewAI workflows with multiple LLM sizes to handle summarisation, research and translation requests.

Tags: Django, Celery, Redis, Postgres, AI, ML, CrewAI

Languages: Python
