# Sailsjs + Postgres

This sample project is a simple todolist app that demonstrates how to use Sailsjs with the Postgres database. To run your own postgres container, please have environment variable such as POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB ready.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

For development, we use a Postgres container. The Postgres container is defined in the `compose.dev.yaml` file. The Hasura container is defined in the `compose.yaml` file, with some overrides in the `compose.dev.yaml` file so it can correctly connect to the development database container.

To start the development environment, run `docker compose -f ./compose.yaml -f ./compose.dev.yaml up`. This will start the Postgres container and the Hasura container. The Hasura console will be available at `http://localhost:8080` with the password `password`.
**Note:** _If you want to make changes to your database, permissions, etc. you should use the Hasura console and the Hasura CLI to make those changes. See the next section for more information._

### Editing the database/permissions etc.

If you want to edit the database, permissions, or any other Hasura settings such that you can deploy them to production, you should [install the Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/). Then, after starting the development environment, you can run `hasura console` _inside the `./hasura` directory_. This will open the Hasura console in your browser. Any changes you make in the console will be saved to the `migrations` and `metadata` directories. When you run `defang compose up` these changes will be applied to the production environment.

## Deploying

1. Open the terminal and type `defang login`
2. Add your connection string as a defang config value by typing `defang config set HASURA_GRAPHQL_DATABASE_URL` and pasting your connection string (which should be in the format `postgres://username:password@host:port/dbname`)
3. Setup a password for hasura by typing `defang config set HASURA_GRAPHQL_ADMIN_SECRET` and adding a password you would like to login with.
4. Type `defang compose up` in the CLI.
5. Your app will be running within a few minutes.

---

Title: Postgres + sailsjs

Short Description: A sample project demonstrating how to deploy a project with Postgres + Sailsjs

Tags: Postgres, Sailsjs,

Languages: sql, nodejs
