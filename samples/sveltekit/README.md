# Sveltekit

This sample shows how to get a minimal SvelteKit app up and running with Defang.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. Have a managed database service configured and have the connection string ready.
3. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
4. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)


## Development

To develop this app, you can run the sveltekit commands as you normally would on your local machine in the sveltekit directory. If you plan on adding other services, you might want to run it with docker compose. We have provided a `compose.dev.yaml` file and a `dev.Dockefile` to help you get started. Just run `docker compose -f compose.dev.yaml up` to start your Sveltekit app in dev mode in a container.


## Deploying
1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

---

Title: Sveltekit

Short Description: A sample project demonstrating how to deploy a minimal SvelteKit app with Defang.

Tags: sveltekit, typescript, javascript, svelte, nodejs, frontend

Languages: nodejs, typescript, javascript
