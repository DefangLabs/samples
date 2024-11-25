# Huginn

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-huginn-template%26template_owner%3DDefangSamples)

This sample shows how to deploy Huginn with Defang.

Huginn is a system for building agents that perform automated tasks for you online. Huginn's Agents can monitor the web, respond to events, and act on your behalf. They propagate events along a directed graph. It's like a customizable IFTTT or Zapier on your own server, ensuring data privacy.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. Have a managed database service configured and ready, such as [Neon PostgreSQL](https://neon.tech/)
3. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
4. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f ./compose.yaml -f ./compose.dev.yaml up
```
This will start the Postgres container and the Huginn container. Huginn will be available at `http://localhost:3000` with the username `admin` and password `password`.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `DATABASE_NAME` 
The name of the database.
```bash
defang config set DATABASE_NAME
```

### `DATABASE_USERNAME` 
The username used with the database.
```bash
defang config set DATABASE_USERNAME
```

### `DATABASE_PASSWORD` 
The password used with the database.
```bash
defang config set DATABASE_PASSWORD
```

### `DATABASE_HOST` 
The host of the database.
```bash
defang config set DATABASE_HOST
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
    ```bash
    defang --provider=aws compose up
    ```

---

Title: Huginn

Short Description: A system for building agents that perform automated tasks for you online.

Tags: Huginn, Agents, Automation

Languages: Dockerfile
