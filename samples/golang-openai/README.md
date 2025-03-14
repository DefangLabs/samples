# Golang & OpenAI

[![1-click-deploy](https://defang.io/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-golang-openai-template%26template_owner%3DDefangSamples)

This sample demonstrates how to deploy a Go project with OpenAI using Defang.

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
defang config set --name OPENAI_KEY
```

## Testing
Below are some useful commands for testing. 

```bash
echo "Hello" | curl -H "Content-Type: application/text" -d @- https://xxxxxxxx/prompt
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

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
    ```bash
    defang --provider=aws compose up
    ```

---

Title: Go & OpenAI

Short Description: A simple Go application that interacts with the OpenAI API.

Tags: Go, OpenAI, ChatGPT

Languages: golang
