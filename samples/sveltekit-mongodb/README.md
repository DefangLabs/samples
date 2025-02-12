# Sveltekit & MongoDB

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-sveltekit-mongodb-template%26template_owner%3DDefangSamples)

This is a project that demonstrate both client side component rendering and hydration as well as serverside rendering with external API route configuration. Furthermore, there is also a mongodb connection (not hosted on the atlas) to cache the queried results.

## Configuration

For this sample, you will not need to provide [configuration](https://docs.defang.io/docs/concepts/configuration).

If you wish to provide configuration, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
```

## NOTE

This sample showcases how you could deploy a full-stack application with Defang and Sveltekit. However, it deploys mongodb as a defang service. Defang [services](https://12factor.net/processes) are ephemeral and should not be used to run stateful workloads in production as they will be reset on every deployment. For production use cases you should use a managed database like RDS, Aiven, or others. In the future, Defang will help you provision and connect to managed databases.

## Essential Setup Files

1. Download [Defang CLI] (https://github.com/DefangLabs/defang)
2. (optional) If you are using [Defang BYOC] (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated your AWS account.
3. (optional for local development) [Docker CLI] (https://docs.docker.com/engine/install/)

## Prerequisite

1. Download [Defang CLI] (https://github.com/DefangLabs/defang)
2. (optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) make sure you have properly
3. [Docker CLI] (https://docs.docker.com/engine/install/)

4. [NodeJS] (https://nodejs.org/en/download/package-manager)

## Development

For development, we use a local container. This can be seen in the compose.yaml and /src/routes/api/songs/+server.js file and the server.js file where we create a pool of connections. To run the sample locally after clonging the respository, you can run on docker by doing

1.  docker compose up --build

## A Step-by-Step Guide

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Your app should be up and running with Defang in minutes!

---

Title: SvelteKit & MongoDB

Short Description: A full-stack application using SvelteKit for the frontend and MongoDB for the database.

Tags: SvelteKit, MongoDB, Full-stack, Node.js, JavaScript

Languages: nodejs
