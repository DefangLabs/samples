# Node.js HTTP Server

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nodejs-http-template%26template_owner%3DDefangSamples)

This example shows how to build a minimal Node.js application using the [Node.js](https://nodejs.org/) runtime.

## Prerequisites

Install the Defang CLI by following the instructions in the [Defang CLI documentation](https://docs.defang.io/docs/getting-started).

## Build and run the application

If you have environment variables configured for your [own cloud account](https://docs.defang.io/docs/concepts/defang-byoc), this will deploy the application to your cloud account, otherwise it will deploy to the Defang cloud.

```sh
defang compose up
```

## Configuration

For this sample, you will not need to provide [configuration](https://docs.defang.io/docs/concepts/configuration).

If you wish to provide configuration, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
```

---

Title: Node.js HTTP Server

Short Description: A simple Node.js application that creates an HTTP server.

Tags: Node.js, HTTP, Server

Languages: nodejs
