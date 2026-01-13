# FastAPI Postgres Pub/Sub Chat

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-fastapi-postgres-pubsub-template%26template_owner%3DDefangSamples)

This sample pairs FastAPI with PostgreSQL `LISTEN/NOTIFY` to demonstrate real-time updates between two application containers. A minimal chat UI sends messages with a REST request, and both FastAPI instances broadcast the new message over WebSockets after Postgres notifies them.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up --build
```

Once everything is running:
- Visit [http://localhost:8000](http://localhost:8000) for the first FastAPI service.
- Visit [http://localhost:8001](http://localhost:8001) for the second service.
- Send a chat message in either window. Both pages should update immediately, proving Postgres `LISTEN/NOTIFY` fans the event across containers.

Stop the stack with `Ctrl+C`, then run `docker compose -f compose.dev.yaml down`.

## Configuration

For this sample, you can rely on the defaults. Override them with environment variables if needed:

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`
Database password (default `chat_password`).
```bash
defang config set POSTGRES_PASSWORD --random
```

### `SSL_MODE`

Postgres SSL mode (default `disable`, should set to `require` in production).
```bash
defang config set SSL_MODE=require
```

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

Title: FastAPI Postgres Pub/Sub

Short Description: FastAPI sample that stores messages in Postgres and streams them to two app instances via LISTEN/NOTIFY.

Tags: FastAPI, PostgreSQL, WebSockets, PubSub

Languages: Python, SQL
