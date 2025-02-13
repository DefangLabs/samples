# MCP

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-mcp-template%26template_owner%3DDefangSamples)

This is a sample of an MCP (Model Context Protocol) chatbot application built with Next.js, Python, and Anthropic Claude, deployed using Defang. 

This example uses Docker's [`mcp/time`](https://hub.docker.com/r/mcp/time) image as a base for the MCP server (with MCP tools included), but it can be adapted to use any of the Docker [MCP images](https://hub.docker.com/u/mcp). 

### How It Works

The [MCP client](https://modelcontextprotocol.io/quickstart/client) is written in Python and ran in a `venv` virtual environment. The MCP server is provided by the Docker `mcp/time` image. The MCP server communicates with the MCP client in a Quart app (i.e. Asynchronous Server Gateway Interface (ASGI) version of Flask) through the `stdio` transport method, as seen in `/mcp-server/main.py`. For more on MCP transport methods, see [here](https://modelcontextprotocol.io/docs/concepts/transports).

The UI (User Interface) and web server are built in Next.js (see `/ui/src/app`). The web server includes a forwarding action to connect to the MCP client. 

Here's a breakdown of what happens when you interact with the UI:
1. When a user submits a query to the chatbot, the browser sends a request to the Next.js web server. 
2. The Next.js web server will forward this request to the MCP client via a REST endpoint. 
3. The MCP client processes the request by interacting with the Anthropic (Claude) API and tools available through the MCP server. 
4. Once the response is generated, it is sent back to the Next.js web server and displayed to the user in the UI. 

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose up --build
```

## Configuration
For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `ANTHROPIC_API_KEY` 
An API key for accessing the [Anthropic Claude API](https://docs.anthropic.com/en/api/getting-started).
```bash
defang config set ANTHROPIC_API_KEY
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud).

---

Title: Model Context Protocol (MCP) Chatbot

Short Description: An MCP (Model Context Protocol) chatbot assistant built with Next.js, Python, and Anthropic Claude. 

Tags: MCP, Next.js, Python, Quart, Claude, AI, Anthropic, TypeScript, React, JavaScript

Languages: nodejs, python
