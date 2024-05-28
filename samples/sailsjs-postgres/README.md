# Sailsjs + Postgres

This sample project demonstrates how to deploy

Sailsjs with Defang and connect it to a Postgres database. Furthermore, we emonstrate how to run a local Postgres container during development vs a managed postgres service (Neon). For a quick database set up please go to [Neon](https://neon.tech/) and follow set up instructions. The sample starts with a no tasks in the database and allows us to add tasks on the fly. It sets wide open permissions on the tables as well so you can start querying or mutating the data right away.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)
4. (Optional) [Neon CLI] (https://neon.tech/docs/reference/neon-cli)

## Development

For development, we use a Postgres container. The Postgres container is defined in the `compose.dev.yaml` file. The Hasura container is defined in the `compose.yaml` file, with some overrides in the `compose.dev.yaml` file so it can correctly connect to the development database container. To start your own, please have the env variables, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, and SESSION_SECRET ready.

To start the development environment, run: _(ask raph about the ordering)_
docker compose -f compose.yaml -f compose.dev.yaml up --build

## Deploying production

1. Open the terminal and type `defang login`
2. Add your connection string for the third party postgres database in the DATABASE_URL part of the compose.yaml section
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

---

Title: Postgres + sailsjs

Short Description: A sample project demonstrating how to deploy a project with Postgres + Sailsjs

Tags: Postgres, Sailsjs,

Languages: sql, nodejs

```

```
