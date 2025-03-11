# Nounly

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nounly-template%26template_owner%3DDefangSamples)

Nounly (also known as Noun.ly) is a URL shortener website built with Go, JavaScript and Redis, and can be deployed with Defang as a sample.

The URL shortener appends a noun to the end of a Defang-deployed URL to create the new shortened URL. For reference, you can view the real [Noun.ly](https://noun.ly/) website here.

_"Share the web through words."_ - Creator of Nounly

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

### `PROJECT_HONEYPOT_KEY`

A [Project Honey Pot API](https://www.projecthoneypot.org/index.php) key that is used for anti-spamming. It is optional, but please include a non-empty string value.

```bash
defang config set PROJECT_HONEYPOT_KEY
```

### `SHARED_SECRETS`

A JSON object string of shared secrets that are used for API clients. It is optional, but please set to "{}" (without the quotation marks) if you do not have any shared secrets.

```bash
defang config set SHARED_SECRETS
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

Title: Nounly

Short Description: A URL shortener website built with Go, JavaScript, and Redis.

Tags: Go, JavaScript, Redis, URL shortener

Languages: golang, javascript
