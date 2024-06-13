# BullMQ & BullBoard & Redis

This sample project demonstrates how to deploy a BullMQ message queue on top of managed Redis with a queue processor and a dashboard to monitor the queue.

Once your app is up and running you can go to the `/board` route for the `board` service to see the Bull Board dashboard and use the username `admin` and the password you set to log in (see [Deploying](#deploying)).

To add a job to the queue, you can go to the `/add` route of the `api` service. This will use some default values so you can test things out. You can also see an example of a post request in the [sample http request](./api/add.test.http) file.

The `worker` service is the queue processor that will process the jobs added to the queue. You can see in the `compose.yaml` file that the `worker` service is set to scale to 2 instances. This means that there will be 2 workers processing jobs from the queue. You can set this to your desired number of workers, but we wanted to show how you can increase the number of workers to handle more jobs.


## Prerequisites

1. Download <a href="https://github.com/defang-io/defang">Defang CLI</a>
2. (optional) If you are using <a href="https://docs.defang.io/docs/concepts/defang-byoc">Defang BYOC</a>, make sure you have properly <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html">authenticated your AWS account</a>.

## Deploying

1. Open the terminal and type `defang login`
2. Run `defang config set BOARD_PASSWORD` to set the password for the BullBoard dashboard.
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.


## Local Development

1. Run `docker compose -f compose.dev.yaml up`

---

Title: BullMQ & BullBoard & Redis

Short Description: A sample project with BullMQ, BullBoard, and Redis.

Tags: BullMQ, BullBoard, Redis, Express, Node.js, Message Queue

Languages: nodejs, javascript
