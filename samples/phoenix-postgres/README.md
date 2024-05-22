# Phoenix + Postgres

This is a sample Phoenix application that uses a PostgreSQL database. The sample doesn't add anything to the database, but is based off of the default Phoenix getting started instructions which add a postgres database to the application.

## Prerequisites
1. Download <a href="https://github.com/defang-io/defang">Defang CLI</a>
2. Have a managed database service configured and have the connection string ready.
3. (optional) If you are using <a href="https://docs.defang.io/docs/concepts/defang-byoc">Defang BYOC</a>, make sure you have properly <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html">authenticated your AWS account</a>.

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up
```

## Deploying
1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

---

Title: **TODO: TITLE**

Short Description: **TODO: DESCRIPTION**

Tags: **TODO: TAGS**

Languages: **TODO: LANGUAGES**
