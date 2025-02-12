# Metabase & Postgres

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-metabase-template%26template_owner%3DDefangSamples)

Metabase is a simple and powerful analytics tool which lets anyone learn and make decisions from their company’s data. This sample demonstrates how to deploy Metabase with Defang. In development, we run a postgres container and in production, we use a managed postgres service. To build the sample, we used Neon, because of their simplicity and generous free tier.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. Have a managed database service configured and have the connection details ready.
3. (optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

## Local

For development, we use a Postgres container. The Postgres container is defined in the `compose.dev.yaml` file. The Metabase container is defined in the `compose.yaml` file, with some overrides in the `compose.dev.yaml` file so it can correctly connect to the development database container.

To start the development environment, run `docker compose -f ./compose.yaml -f ./compose.dev.yaml up`. This will start the Postgres container and the Metabase container. Metabase will be available at `http://localhost:3000`.

Since Metabase is a self contained application, there isn't an actual development process, but you can use the development environment to see how Metabase works.

## Deploying

1. Open the terminal and type `defang login`
2. Add your database connection details using `defang config` by typing `defang config set <CONFIG_VAL>` where `<CONFIG_VAL>` is the each of the following `MB_DB_DBNAME`, `MB_DB_HOST`, `MB_DB_PORT`, `MB_DB_USER`, `MB_DB_PASS` (to set the database name, host, port, user, and password respectively). For example `defang config set MB_DB_DBNAME` and pasting your database name.
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

## Configuration

For this sample, you will not need to provide [configuration](https://docs.defang.io/docs/concepts/configuration).

If you wish to provide configuration, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
```

---

Title: Metabase & PostgreSQL

Short Description: A simple Metabase configuration with a PostgreSQL database.

Tags: Metabase, PostgreSQL, Analytics, Database

Languages: SQL
