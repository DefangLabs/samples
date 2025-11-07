# Mastra and Next.js Sample

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-mastra-nextjs-template%26template_owner%3DDefangSamples)

This sample shows how to deploy an AI-powered GitHub repository chat tool using [Mastra](https://mastra.ai/), a TypeScript AI framework. Mastra-nextjs allows you to chat with and understand any GitHub repository by fetching file trees, contents, pull requests, and issues, making it easy to navigate and understand codebases of any size.

## Features

- **Repository Analysis**: Enter a GitHub repository URL and instantly start a conversation about it
- **Code Exploration**: Navigate file trees, view file contents, and understand code structure
- **PR & Issue Access**: Query information about pull requests and issues directly in chat
- **Large Codebase Support**: Powered by Google's Gemini Flash model with its large context window
- **Intuitive UI**: Built with assistant-UI for a seamless chat experience with retries, copy, and message branching

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally for development, use the development compose file:

```bash
docker compose -f compose.dev.yaml up
```

This will:

- Start PostgreSQL with volume persistence for local development
- Expose PostgreSQL on port 5432 for direct access if needed
- Start the Next.js application on port 3000 with hot reload

You can access mastra-nextjs at `http://localhost:3000` once the containers are running.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `GOOGLE_GENERATIVE_AI_API_KEY`

Your Google Generative AI API key for accessing the Gemini Flash model. You can get this from the [Google AI Studio](https://aistudio.google.com/).

### `POSTGRES_PASSWORD`

The password for your Postgres database. You need to set this before deploying for the first time.

_You can easily set this to a random string using `defang config set POSTGRES_PASSWORD --random`_

### `DB_URL`

The [PostgreSQL database connection string](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING). This will be automatically configured when using BYOC managed database services. It should look something like this: `postgresql://[user[:password]@][netloc][:port][/dbname][?param1=value1&...]`.

### `DB_SSL`

Set to `true` to enable SSL. Set to `false` to disable SSL. (Can be set directly in the Docker Compose file.)

### `GITHUB_TOKEN` (Optional)

A [GitHub personal access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token) to increase API rate limits when fetching repository data. This is optional but recommended for better performance.
Setting the permissions to public repositories only is sufficient, unless you want to access private repositories that you have access to.

## Usage

1. Enter a GitHub repository URL in the input field (e.g., `https://github.com/DefangLabs/defang`)
2. Start chatting with mastra-nextjs about the repository
3. Use commands like:
   - "Show me the file structure"
   - "What are the recent pull requests?"
   - "Explain the purpose of [filename]"
   - "How many open issues are there?"

## How It Works

Mastra-nextjs uses a tool-based approach rather than traditional RAG systems, making it more efficient for large codebases. When you provide a repository URL, Mastra-nextjs uses tools to:

1. Fetch the repository's file tree
2. Access file contents on demand
3. Retrieve information about pull requests and issues
4. Store conversation history using Mastra's memory package

The large context window of Gemini Flash allows the agent to hold more code in memory, making the conversation more coherent and informed.

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:

```bash
defang compose up
```

### BYOC (Deploy to your own AWS or GCP cloud account)

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

> [!WARNING] > **Extended deployment time:** This sample creates a managed PostgreSQL database which may take upwards of 20 minutes to provision on first deployment. Subsequent deployments are much faster (2-5 minutes).

This sample was based off of mastra's [repo-chat sample](https://github.com/mastra-ai/repo-base).

---

Title: Mastra & Next.js

Short Description: An AI-powered tool for chatting with GitHub repositories using Mastra and Google Gemini.

Tags: AI, GitHub, Mastra, Next.js, PostgreSQL, TypeScript

Languages: TypeScript, JavaScript, Docker
