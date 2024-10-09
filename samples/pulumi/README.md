# Pulumi

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-pulumi-template%26template_owner%3DDefangSamples)

This basic example shows you how to use the Defang Pulumi provider to deploy the nodejs-http sample with Defang.

## Prerequisites

Install the Defang CLI by following the instructions in the [Defang CLI documentation](https://docs.defang.io/docs/getting-started).

Install the dependencies:

```sh
npm install
```

## Deploying

Create a new stack:

```sh
pulumi stack init production
```

Login to Defang:

```sh
defang login
```

Deploy the application:

```sh
pulumi up
```

---

Title: Pulumi

Short Description: A basic Pulumi example.

Tags: Pulumi, Node.js, HTTP, Server, TypeScript

Languages: nodejs
