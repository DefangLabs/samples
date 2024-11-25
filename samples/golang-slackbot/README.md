# Go & Slack API

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-golang-slackbot-template%26template_owner%3DDefangSamples)

This is a simple slackbot that takes a request and posts the message from the body to a slack channel.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)


### Slack API Token

You'll need to head to https://api.slack.com/apps to create a Slack App.

Make sure to:

- Give it the bot `chat:write` scope
- Install the app to your workspace
- Copy the Bot User OAuth Access Token
- Invite your bot to the channel you want it to post to using the `@botname` command in the channel (this will allow you to invite it)


## Development

To run the application locally, you can use the following command:

```bash
docker compose up --build
```

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration): 

> Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `SLACK_TOKEN`
This is the token you've copied previously for the Slack API.
```bash
defang config set SLACK_TOKEN 
```

### `SLACK_CHANNEL_ID`
This is the ID of the Slack channel where the bot will post messages.
```bash
defang config set SLACK_CHANNEL_ID 
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


## Usage

Once the Slackbot is deployed, you can send a POST request to the `/` endpoint with a JSON body containing the message you want to post to the Slack channel. Here's an example:

```sh
curl 'https://raphaeltm-bot--8080.prod1.defang.dev/' \
  -H 'content-type: application/json' \
  --data-raw $'{"message":"This is your bot speaking. We\'ll be landing in 10 minutes. Please fasten your seatbelts."}'
```

---

Title: Go & Slack API

Short Description: A simple Slackbot that posts messages to a Slack channel.

Tags: Go, Slack, Bot

Languages: golang
