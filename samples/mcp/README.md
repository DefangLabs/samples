# MCP

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-<YOUR_SAMPLE_DIR#REMOVE_ME_AFTER_EDITING>-template%26template_owner%3DDefangSamples)

This is a sample of an MCP (Model Context Protocol) chatbot application deployed using Defang. It uses Docker's [`mcp/time` image](https://hub.docker.com/r/mcp/time) as a base for the MCP server (MCP tools included), but it can be adapted to use any of Docker [MCP images](https://hub.docker.com/u/mcp). The MCP server communicates with an MCP client in a Quart app (i.e. ASGI Flask), as demonstrated in `mcp-server/main.py`. Requests sent from the browser are forwarded via UI to the MCP client. The response is created with calls to Anthropic (Claude) API and the appropriate MCP tools accessible by the server. 

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up --build
```

## Configuration
For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `ANTHROPIC_API_KEY` 
An API key for Anthropic AI.
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

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
    ```bash
    defang --provider=aws compose up
    ```

---

Title: Sample Title #REMOVE_ME_AFTER_EDITING

Short Description: A short sentence or two describing the sample. #REMOVE_ME_AFTER_EDITING

Tags: Tags, That, Are, Not, Programming, Languages #REMOVE_ME_AFTER_EDITING

Languages: Programming, Languages, Used #REMOVE_ME_AFTER_EDITING
