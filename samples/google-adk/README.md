# Google ADK Sample

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-google-adk-template%26template_owner%3DDefangSamples)

This is a simple sample demonstrating how to deploy agents build with Google ADK to Defang.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)


## Development

To run the application locally, you can use the following command:

```bash
docker compose up --build
```

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the Defang Playground by opening up your terminal and typing:
```bash
defang compose up
```

### BYOC (GCP)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your GCP account](https://cloud.google.com/sdk/docs/quickstart).
2. Run in a terminal that has access to your GCP project id:
    ```bash
    GCP_PROJECT_ID=my-project-12345 defang --provider=gcp compose up

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run in a terminal that has access to your AWS environment variables:
    ```bash
    defang --provider=aws compose up

---

Title: Google ADK

Short Description: A simple sample demonstrating how to deploy agents build with Google ADK to Defang.

Tags: Google ADK, Python, Agents

Languages: python
