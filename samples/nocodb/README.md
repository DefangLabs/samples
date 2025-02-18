# NocoDB

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nocodb-template%26template_owner%3DDefangSamples)

This sample demonstrates how to deploy a Nocodb instance with Defang. It's an open source alternative to AirTable, that makes it easy to organize and manage data.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. A Postgres database
3. S3 bucket and credentials, or S3 compatible alternative
4. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
5. (Optional - for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `NC_DB`

Postgres database URL. NocoDB uses an odd, custom format for this. It should look like this: `pg://my.pg.hostname.com:5432?u=postgres&p=password&d=nocodb&ssl=true`. [Neon](https://neon.tech/) has a free tier and is easy to set up.

### `NC_S3_ENDPOINT`

S3 endpoint URL. [Wasabi](https://wasabi.com/) is a simple option for this if you don't already have an S3 bucket or don't have an AWS account you can use.

### `NC_S3_BUCKET_NAME`

Name of the S3 bucket.

### `NC_S3_REGION`

Region of the S3 bucket.

### `NC_S3_ACCESS_KEY`

Access key for the S3 bucket.

### `NC_S3_ACCESS_SECRET`

Access secret for the S3 bucket.

## Deploying

1. Open the terminal and type `defang login`
2. Use the deploy the configuration values specified above using the [`defang config set` command](https://docs.defang.io/docs/concepts/configuration).
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

## Development

For development, we use a local postgres container and a volume mount for file uploads. To run the app locally, just run:

`docker compose --file compose.dev.yaml up --build`

## Configuration
If you wish to provide more configurations, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
```

---

Title: NocoDB

Short Description: An open source alternative to AirTable.

Tags: NocoDB

Languages: Dockerfile
