# Rocket

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-rocket-template%26template_owner%3DDefangSamples)

This sample demonstrates how to deploy a very simple Rocket app. Rocket is a web framework for Rust.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticate against your AWS account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
docker compose up
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the defang playground by opening up your terminal and typing `defang up`.

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run `defang up` in a terminal that has access to your AWS environment variables.

---

Title: Rocket

Short Description: A simple Rocket app.

Tags: Rocket

Languages: Rust
