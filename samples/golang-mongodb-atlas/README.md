# Go & MongoDB Atlas

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-golang-mongodb-atlas-template%26template_owner%3DDefangSamples)

This sample is a task manager application that uses Go and MongoDB Atlas, deployed with Defang. 

HTML and JavaScript are used for the frontend to interact with the backend via API calls. There is a `go.mod` file that includes dependencies for the Dockerfile to install.

There is a environment variable named `MONGO_URI` for the `MONGODB` connection string. In the `compose.yaml` file, be sure to put your MongoDB URI, i.e.
   `mongodb+srv://<username>:<pwd>@host`.

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

### `MONGODB_URI` 
A URI for MongoDB that should have a format of `mongodb+srv://<username>:<pwd>@host`.
```bash
defang config set MONGODB_URI
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

Title: Go & MongoDB Atlas

Short Description: A simple Go application that manages tasks with MongoDB Atlas.

Tags: Go, MongoDB, Atlas, Task Manager

Languages: golang
