# FeathersJS Application with Defang

This sample project demonstrates how to deploy a FeathersJS application on to AWS using Defang. We also demonstrate how to run the application in both development and production environments using Docker Compose.

[1-click deploy](https://github.com/new?template_name=sample-feathersjs-template&template_owner=DefangSamples)

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang) (for Defang deployment)
2. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)
3. (Optional - for local development) [Node.js](https://nodejs.org/en/download/)

### Local Development

For development, we use Docker to containerize the FeathersJS application. The Docker Compose configuration is defined in the `compose.dev.yaml` file.

To start the development environment, run:

```sh
docker compose -f compose.dev.yaml up --build
```

# Deploying

1. Open the terminal and type defang login
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

---

Title: Feathers.js

Short Description: A sample project demonstrating how to deploy a Feathers.js application using Defang. The application displays "DefangxFeathersjs" on the webpage.

Tags: Feathers.js, Node.js, JavaScript

Languages: nodejs
