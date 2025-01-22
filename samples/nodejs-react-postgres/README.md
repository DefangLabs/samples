# Node.js & React & PostgreSQL

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nodejs-react-postgres-template%26template_owner%3DDefangSamples)`

This sample project demonstrates how to deploy a full-stack application using React for the frontend, Node.js for the backend, and PostgreSQL for the database. 

In this sample, we have set up the essential files you need to deploy in production using [Neon](https://neon.tech/) to host your database. We use a connection string to connect Neon to your code. By replacing the pre-configured connection string at .env and at the compose file to yours, you will be ready to deploy this sample with Neon.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up --build
```
Or run without using Docker by doing the following:

1. run `npm install` to install the nodejs dependencies in both the `client` directory and the `server` directory
2. create or modify the .env file in both the `client` directory and the `server` directory with localhost, or create a .env.local to override the .env file.
3. run `npm start`

## Configuration
For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `DATABASE_URL`
A connection to the database, which should be in the format of `postgres://username:password@host:port/dbname`.
```bash
defang config set DATABASE_URL
```

### `REACT_APP_API_URL`
A URL for the React App. For this, you will need to update the `compose.yaml` file to replace `<YOUR_USERNAME>` with your username, which you can get by running `defang whoami`.

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC (AWS)

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud):

---

Title: Node.js & React & PostgreSQL

Short Description: A full-stack to-do list application.

Tags: Node.js, React, Full-stack, PostgreSQL, JavaScript, SQL

Languages: nodejs
