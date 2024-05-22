# Phoenix + Postgres

Defang is the easiest way to deploy containerized apps like this Phoenix + Postgres sample to AWS. This is a sample Phoenix application that uses a PostgreSQL database. The sample doesn't add anything to the database, but is based off of the default Phoenix getting started instructions which add a postgres database to the application.

## Prerequisites
1. Download [Defang CLI](https://github.com/defang-io/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up
```

This will run Phoenix in development mode. If you need to run any commands in the container, after you have run the command above and started the container, you can run the command in a new terminal:

```bash
docker compose -f compose.yaml -f compose.dev.yaml exec phoenix bash
```

## Deploying
1. Open the terminal and type `defang login`
2. Provide values for `SECRET_KEY_BASE` and `DATABASE_URL`
    - `SECRET_KEY_BASE` is a secret key used by Phoenix to sign cookies and other things. You can generate one by running `docker compose -f compose.yaml -f compose.dev.yaml run --rm phoenix mix phx.gen.secret`
    - `DATABASE_URL` is the connection string for your PostgreSQL database. It should look something like `ecto://username:password@hostname/dbname`
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

---

Title: Phoenix + Postgres

Short Description: A sample Phoenix application that uses a PostgreSQL database.

Tags: phoenix, postgres, database, elixir

Languages: elixir
