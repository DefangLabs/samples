# FastAPI & PostgreSQL

This sample project demonstrates how to deploy FastAPI with PostgreSQL with Defang.

## Prerequisites

1. Download <a href="https://github.com/defang-io/defang">Defang CLI</a>
2. (optional) If you are using <a href="https://docs.defang.io/docs/concepts/defang-byoc">Defang BYOC</a>, make sure you have properly <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html">authenticated your AWS account</a>.

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

## One click deployment

1. Open the main [Defang](https://defang.io/) page
2. Navigate to the samples section and search `FastAPI & PostgreSQL`
3. Click the one-click deploy option. This will prompt you to create a repository and run a github action to deploy this project.
4. To monitor your services' status in the defang portal, check out the Deploy step for the URL to the portal.

## Local Development

1. Run `docker compose -f compose.dev.yaml up`

---

Title: FastAPI & PostgreSQL

Short Description: A sample project with FastAPI and PostgreSQL

Tags: FastAPI, PostgreSQL, Python, SQL

Languages: python
