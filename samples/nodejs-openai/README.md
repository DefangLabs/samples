# Node.js & OpenAI

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nodejs-openai-template%26template_owner%3DDefangSamples)

A simple Node.js and OpenAI app deployed using Defang.

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

### `OPENAI_KEY`
An API key to access the OpenAI API.
```bash
defang config set OPENAI_KEY
```

## Testing
Below are some useful commands for testing. 

```bash
echo "Hello" | curl -H "Content-Type: text/plain" -d @- https://xxxxxxxx/prompt
```

or alternatively,

```bash
cat prompt.txt | curl -H "Content-Type: application/text" -d @- https://xxxxxxxx/prompt
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

If you want to deploy to your own cloud account, you can [use Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud):

---

Title: Node.js & OpenAI

Short Description: A simple Node.js application that interacts with the OpenAI API.

Tags: Node.js, OpenAI, API, JavaScript

Languages: nodejs
