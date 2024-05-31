# GraphQL API with Hasura + Postgres

This sample project demonstrates how to deploy Hasura with Defang and connect it to a Postgres database. We also demonstrate how to run a Postgres container during development and how to switch over to a managed postgres service like RDS, Neon, or others in production. If you want to get a compatible database ready to go really quickly for free, [Neon](https://neon.tech/) is a quick and easy way to go. The sample populates the database with some sample data so you can quickly start playing with the Hasura console. It sets wide open permissions on the tables as well so you can start querying or mutating the data right away.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. Have a managed database service configured and have the connection string ready.
3. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
4. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)
5. (Optional) [Install the Hasura CLI](https://hasura.io/docs/latest/hasura-cli/install-hasura-cli/) to create migrations and update metadata for your Hasura GraphQL api.



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

Title: GraphQL API with Hasura + Postgres

Short Description: A sample project demonstrating how to deploy Hasura with Defang and connect it to a Postgres database

Tags: hasura, graphql, postgres, database

Languages: sql, graphql
