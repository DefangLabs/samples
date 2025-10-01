# Crew.ai Django Sample

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-crew-django-redis-postgres-template%26template_owner%3DDefangSamples)

This sample shows how to use Crew.ai with a Django application. It provides a simple web interface that allows users to input text and receive a summary of the text in real-time using Django Channels with a Redis broker. It uses Celery to handle the Crew.ai tasks in the background with Redis as a broker. It uses Postgres as the database for Django.

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

Title: Crew.ai Django Sample

Short Description: A sample application that uses Crew.ai to summarize text in a background task, streamed to the user in real-time.

Tags: Django, Celery, Redis, Postgres, AI, ML

Languages: Python
