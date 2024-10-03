# Starter Sample #REMOVE_ME_AFTER_EDITING

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-<YOUR_SAMPLE_DIR#REMOVE_ME_AFTER_EDITING>-template%26template_owner%3DDefangSamples)

This is a sample that shows the rough structure of an actual Defang sample. This top paragraph should give a bit of context about the project and what it does. The rest of the README should be a guide on how to use the sample. #REMOVE_ME_AFTER_EDITING

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

To run the application locally, you can use the following command:

```bash
# This might be `docker compose -f compose.dev.yaml up` depending on the project. #REMOVE_ME_AFTER_EDITING
docker compose up
```

## Configuration
#REMOVE_ME_AFTER_EDITING - this section should be removed if there are no configuration values needed. The intro text can probably stay, but the list of configuration values should be updated/removed if there are none.

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `API_KEY` #REMOVE_ME_AFTER_EDITING
An explanation of what the env var (`API_KEY`) is, etc.

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the defang playground by opening up your terminal and typing `defang up`.

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and check that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
2. Run `defang --provider=aws up` in a terminal that has access to your AWS environment variables.

---

Title: Sample Title #REMOVE_ME_AFTER_EDITING

Short Description: A short sentence or two describing the sample. #REMOVE_ME_AFTER_EDITING

Tags: Tags, That, Are, Not, Programming, Languages #REMOVE_ME_AFTER_EDITING

Languages: Programming, Languages, Used #REMOVE_ME_AFTER_EDITING
