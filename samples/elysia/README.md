# Elysia & Bun

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-elysia-template%26template_owner%3DDefangSamples)

A basic [Elysia](https://elysiajs.com/) app running on [Bun](https://bun.sh/) with a Dockerfile and compose.yaml ready to deploy to AWS with [Defang](https://defang.io).

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Deploying

1. Run `defang login` if you are not yet logged in.
2. Run `defang compose up`.
3. Your app will be running within a few minutes.

## Local Development

1. Run `docker compose -f compose.dev.yaml up`

---

Title: Elysia & Bun

Short Description: A basic Elysia app running on Bun with Defang.

Tags: Bun, Elysia, TypeScript, JavaScript

Languages: nodejs
