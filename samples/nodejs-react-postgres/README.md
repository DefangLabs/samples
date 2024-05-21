# About this project
This sample project demonstrates how to deploy a full-stack application using React for the frontend, Node.js for the backend, and PostgreSQL for the database. The project uses Docker to containerize the services, making it easy to run in both development and production environments.

## NOTE

This sample showcases how you could deploy a full-stack to-do list application with Defang and React and NodeJS. However, it deploys PostgreSQL db as a defang service. Defang [services](https://12factor.net/processes) are ephemeral and should not be used to run stateful workloads in production as they will be reset on every deployment. For production use cases you should use a managed database like RDS, Aiven, or others. In the future, Defang will help you provision and connect to managed databases.

## Essential Setup Files

1. Download [Defang CLI] (https://github.com/defang-io/defang)
2. (optional) If you are using [Defang BYOC] (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated your AWS account.
3. (optional for local development) [Docker CLI] (https://docs.docker.com/engine/install/)

## Development

For development, we use a local container. This can be seen in the compose.yaml file where we create a pool of connections. To run the sample locally after clonging the respository, you can run on docker by doing _docker compose up --build_ by doing the following
1. create or modify the .env file in both the `client` directory and the `server` directory with localhost, or create a .env.local to override the .env file.

Or run without using Docker by doing the following:
1. run npm install to install the nodejs dependencies in both the `client` directory and the `server` directory
2. create or modify the .env file in both the `client` directory and the `server` directory with localhost, or create a .env.local to override the .env file.
3. run npm start

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

---

Title: React, Node.js, and PostgreSQL

Short Description: A full-stack to-do list application

Tags: React, Node.js, full-stack, PostgreSQL

Languages: nodejs, javascript, sql
