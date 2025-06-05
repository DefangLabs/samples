# Go & MongoDB

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-golang-mongodb-template%26template_owner%3DDefangSamples)

This sample is a task manager application that uses Go and MongoDB, deployed with Defang.

HTML and JavaScript are used for the frontend to interact with the backend via API calls. There is a `go.mod` file that includes dependencies for the Dockerfile to install.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose up --build
```

## Configuration
For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration):

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `MONGO_INITDB_ROOT_USERNAME`
The username for the MongoDB database.
```bash
defang config set MONGO_INITDB_ROOT_USERNAME
```

### `MONGO_INITDB_ROOT_PASSWORD`
The password for the MongoDB database.
```bash
defang config set MONGO_INITDB_ROOT_PASSWORD
```

### Using MongoDB Atlas

If you want to use MongoDB Atlas, you can set the URI with `defang config set MONGO_URI` and remove the value from the `MONGO_URI` environment variable so that it is read from defang config. For example, in your `compose.yaml` file:

```yaml
services:
  app:
    environment:
      - MONGO_URI # empty values are read from defang config
```

### Using DocumentDB in AWS

If you want to use DocumentDB in AWS, you can add the `x-defang-mongodb` extension to your `compose.yaml` file:

```yaml
services:
  db:
    x-defang-mongodb: true
```

This will automatically provision a DocumentDB cluster in your AWS account.

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

Title: Go & MongoDB

Short Description: A simple Go application that manages tasks with MongoDB.

Tags: Go, MongoDB, Atlas, Task Manager

Languages: golang
