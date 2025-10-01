# MCP

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-mcp-template%26template_owner%3DDefangSamples)

This is a sample of a Model Context Protocol (MCP) chatbot application built with Next.js, Python, and Anthropic Claude, deployed using Defang. 

This example uses Docker's [`mcp/time`](https://hub.docker.com/r/mcp/time) image as a base for the MCP Server (with MCP tools included), but it can be adapted to use any of the Docker [MCP images](https://hub.docker.com/u/mcp). 

### How It Works

#### Service 1 (Web Server with UI)

The web server and UI are built in Next.js (see `/service-1/src/app`). The web server includes a forwarding action to connect to the MCP Client. 

#### Service 2 (MCP Client and MCP Server)
The [MCP Client](https://modelcontextprotocol.io/quickstart/client) is written in Python and ran in a `venv` virtual environment. The MCP server is provided by the Docker `mcp/time` image. The MCP Server communicates with the MCP Client in a [Quart](https://quart.palletsprojects.com/en/latest/index.html) app (i.e. Asynchronous Server Gateway Interface (ASGI) version of Flask) through the `stdio` transport method, as seen in `/service-2/main.py`. For more on MCP transport methods, see [here](https://modelcontextprotocol.io/docs/concepts/transports).

Here's a breakdown of what happens when a user interacts with the UI:
1. When a user submits a query to the chatbot, the browser sends a request to the Next.js web server. 
2. The Next.js web server will forward this request to the MCP Client via a REST endpoint. 
3. The MCP Client processes the request by interacting with the Anthropic (Claude) API and tools available through the MCP Server. 
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
