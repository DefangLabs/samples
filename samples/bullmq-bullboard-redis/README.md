# BullMQ & BullBoard & Redis

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-bullmq-bullboard-redis-template%26template_owner%3DDefangSamples)

This sample demonstrates how to deploy a BullMQ message queue on top of managed Redis with a queue processor and a dashboard to monitor the queue.

Once your app is up and running you can go to the `/board` route for the `board` service to see the Bull Board dashboard and use the username `admin` and the board password you set to log in (see [Configuration](#configuration)).

To add a job to the queue, you can go to the `/add` route of the `api` service. This will use some default values so you can test things out. You can also see an example of a post request in the [sample HTTP request](./api/add.test.http) file.

The `worker` service is the queue processor that will process the jobs added to the queue. You can see in the `compose.yaml` file that the `worker` service is set to scale to 2 instances. This means that there will be 2 workers processing jobs from the queue. You can set this to your desired number of workers, but we wanted to show how you can increase the number of workers to handle more jobs.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up --build
```

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `BOARD_PASSWORD`
Set a board password and use together with the board username `admin` when signing in.
```bash
defang config set BOARD_PASSWORD
```

### `QUEUE`
```bash
defang config set QUEUE
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

Title: BullMQ & BullBoard & Redis

Short Description: A sample project with BullMQ, BullBoard, and Redis.

Tags: BullMQ, BullBoard, Redis, Express, Node.js, Message Queue, JavaScript

Languages: nodejs
