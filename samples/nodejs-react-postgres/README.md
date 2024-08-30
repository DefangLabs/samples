# React & Node.js & PostgreSQL

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nodejs-react-postgres-template%26template_owner%3DDefangSamples)`

This sample project demonstrates how to deploy a full-stack application using React for the frontend, Node.js for the backend, and PostgreSQL for the database. The project uses Docker to containerize the services, making it easy to run in both development and production environments.

In this sample, we have set up the essential files you need to deploy in production using [Neon](https://neon.tech/) to host your database. We use a connection string to connect Neon to your code. By replacing the pre-configured connection string at .env and at the compose file to yours, you will be ready to deploy this sample with Neon.

## Essential Setup Files

1. Download [Defang CLI] (https://github.com/defang-io/defang)
2. (optional) If you are using [Defang BYOC] (https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated your AWS account.
3. (optional for local development) [Docker CLI] (https://docs.docker.com/engine/install/)

## Development

To start the development environment, run `docker compose -f ./compose.yaml -f ./compose.dev.yaml up`. This will start the Postgres container, the React container, and the NodeJS container. The development container (compose.dev.yaml) will override the production container (compose.yaml).

Or run without using Docker by doing the following:

1. run npm install to install the nodejs dependencies in both the `client` directory and the `server` directory
2. create or modify the .env file in both the `client` directory and the `server` directory with localhost, or create a .env.local to override the .env file.
3. run npm start

## Deploying

1. Open the terminal and type `defang login`
2. Add your connection string as a defang config value by typing `defang config set DATABASE_URL` and pasting your connection string (which should be in the format `postgres://username:password@host:port/dbname`)
3. Update your `compose.yaml` file to replace `<YOUR_USERNAME>` with your username (which you can get by running `defang whoami`. "Tenant" is your username.)
4. Type `defang compose up` in the CLI.
5. Your app will be running within a few minutes.

---

Title: React & Node.js & PostgreSQL

Short Description: A full-stack to-do list application.

Tags: React, Node.js, Full-stack, PostgreSQL, JavaScript, SQL

Languages: nodejs
