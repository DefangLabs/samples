# Django Channels & Redis & Postgres

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-django-channels-redis-template%26template_owner%3DDefangSamples)

This sample demonstrates how to get Django Channels up and running with Redis and Postgres both managed by Defang. It demonstrates how to do this with a simple chat application.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up
```

This will start the Django server, Redis, and Postgres and mounts your Django app so you get live reloading. You can access the Django server at `http://localhost:8000`.

## Configuration
For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `SECRET_KEY`
The secret key for your Django application. You can generate a new one by running `python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'`. A default, insecure key is used if this is not set, but you should set it for a production deployment.

### `POSTGRES_PASSWORD`
The password for your Postgres database. You need to set this before deploying for the first time.

## Deploying

1. Open the terminal and type `defang login`
2. Use the [`defang config`](https://docs.defang.io/docs/concepts/compose#configuration) command to setup environment variables.
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

---

Title: Django Channels & Redis & Postgres

Short Description: A basic configuration of Django Channels with Redis and Postgres demonstrating a simple chat application.

Tags: Django, Channels, Redis, Postgres, Chat, Application

Languages: Python
