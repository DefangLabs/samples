# Laravel

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-laravel-template%26template_owner%3DDefangSamples)

This sample shows how to deploy a minimal [Laravel](https://laravel.com/) application with Defang. Laravel is a popular PHP web application framework with expressive, elegant syntax.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally for development, use the local compose file:

```bash
docker compose -f compose.local.yaml up --build
```

This will:

- Build the Laravel application with development settings
- Enable debug mode and hot reload via volume mounting  
- Start the application on port 8000

You can access the application at `http://localhost:8000` once the container is running.

Changes to your Laravel code will be reflected immediately without needing to rebuild the container.

### Available Endpoints

- `/` - Returns a welcome JSON response with Laravel version
- `/health` - Health check endpoint
- `/up` - Laravel built-in health check endpoint

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration):

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `APP_KEY`

The application key is used for encryption. Laravel requires this to be set.

*You can easily set this to a random string using `defang config set APP_KEY --random`*

Alternatively, generate one using:
```bash
php artisan key:generate --show
```

### `APP_URL` (Optional)

The URL where your application will be accessed. Defaults to `http://localhost:8000`.

```bash
defang config set APP_URL=https://your-domain.com
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

Title: Laravel

Short Description: A minimal Laravel application running on Defang.

Tags: Laravel, PHP, Web Framework

Languages: PHP
