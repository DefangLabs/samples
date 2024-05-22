# Huginn

Huginn is a system for building agents that perform automated tasks for you online. Huginn's Agents can monitor the web, respond to events, and act on your behalf. They propagate events along a directed graph. It's like a customizable IFTTT or Zapier on your own server, ensuring data privacy.


## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. Have a managed database service configured and have the connection details ready. Neon postgres is a good free option.
3. (optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html).

## Local

For development, we use a Postgres container. The Postgres container is defined in the `compose.dev.yml` file. The Huginn container is defined in the `compose.yml` file, with some overrides in the `compose.dev.yml` file so it can correctly connect to the local database container. 

To start the local environment, run `docker compose -f ./compose.yml -f ./compose.dev.yml up`. This will start the Postgres container and the Huginn container. Huginn will be available at `http://localhost:3000` with the username `admin` and password `password`. 

## Deploying

1. Open the terminal and type `defang login`
2. Add your database connection details using `defang config` by typing `defang config set <CONFIG_VAL>` where `<CONFIG_VAL>` is the each of the following `DATABASE_NAME`, `DATABASE_USERNAME`, `DATABASE_PASSWORD`, `DATABASE_HOST`. For example `defang config set DATABASE_NAME` and pasting your database name. 
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

---

Title: Huginn

Short Description: A system for building agents that perform automated tasks for you online

Tags: huginn, agents, automation

Languages: 
