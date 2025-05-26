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
#REMOVE_ME_AFTER_EDITING - this section should be removed if there are no configuration values needed. The intro text can probably stay, but the list of configuration values should be updated/removed if there are none.

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `API_KEY` #REMOVE_ME_AFTER_EDITING
An explanation of what the env var (`API_KEY`) is, etc.
```bash
defang config set API_KEY
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

Title: Sample Title #REMOVE_ME_AFTER_EDITING

Short Description: A short sentence or two describing the sample. #REMOVE_ME_AFTER_EDITING

Tags: Tags, That, Are, Not, Programming, Languages #REMOVE_ME_AFTER_EDITING

Languages: Programming, Languages, Used #REMOVE_ME_AFTER_EDITING
