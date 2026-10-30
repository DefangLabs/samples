# Node.js & React & PostgreSQL

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.io/sample/nodejs-react-postgres)`

This sample project demonstrates how to deploy a full-stack application using React for the frontend, Node.js for the backend, and PostgreSQL for the database. 

In production, the Node.js server also serves the built React app, so one service handles both the UI and the API. The database is a Defang managed Postgres instance.

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

### `POSTGRES_PASSWORD`
The password for the Postgres database.
```bash
defang config set POSTGRES_PASSWORD
```

The server connects to Postgres over SSL, as Defang managed Postgres requires. If you deploy to the Playground, where Postgres runs as a plain container, set `POSTGRES_SSL=false` on the `app` service.

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

Tags: Node.js, React, Full-stack, PostgreSQL, JavaScript, SQL, sample

Languages: nodejs
