# Next.js & Postgres

[1-click deploy](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nextjs-postgres-template%26template_owner%3DDefangSamples)

This is a sample Next.js application that uses Postgres as a database. It is a simple example that demonstrates how to connect to a Postgres database from a Next.js application: on each request it takes the user's IP address, geo-locates it, and stores the result in the database, then displays the last 20 results on the home page.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up
```

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`
A password that will be used to connect to the Postgres database.


## Deploying

1. Open the terminal and type `defang login`
2. Use the [`defang config`](https://docs.defang.io/docs/concepts/compose#configuration) command to setup environment variables. #REMOVE_ME_AFTER_EDITING
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

---

Title: Sample Title #REMOVE_ME_AFTER_EDITING

Short Description: A short sentence or two describing the sample. #REMOVE_ME_AFTER_EDITING

Tags: Tags, That, Are, Not, Programming, Languages #REMOVE_ME_AFTER_EDITING

Languages: Programming, Languages, Used #REMOVE_ME_AFTER_EDITING
