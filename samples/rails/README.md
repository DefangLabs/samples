# Ruby on Rails

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-rails-template%26template_owner%3DDefangSamples)

This template is a member list project developed using Ruby on Rails, offering a starting point to help you quickly build your team management system. We have prepared all the essential files for deployment. By spending less than 10 minutes setting up the environment, as detailed in the prerequisites, and executing the commands in our step-by-step guide, your website will be ready to go live to the world!

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to describe the basic image of your applications.
2. A [docker-compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications.
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) file to comply with the size limit (10MB).

## Development Using [Dev Containers](https://containers.dev/)

1. Open the working directory with Visual Studio Code or any editor which supports Dev Containers.
2. Click on the bottom left corner of the window where you see "Reopen in Container".
3. Open up a shell in the VS Code terminal and run `docker compose -f compose.dev.yaml up`.


## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration). Note that if you are using the 1-click deploy option, you can set these values as secrets in your GitHub repository and the action will automatically deploy them for you.

### `POSTGRES_PASSWORD`
This password will be used to initialize the PostgreSQL database and to connect to it.


## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground

Deploy your application to the defang playground by opening up your terminal and typing `defang up`.

### BYOC (AWS)

If you want to deploy to your own cloud account, you can use Defang BYOC:

1. [Authenticate your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html), and that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

---

Title: Ruby on Rails

Short Description: A basic member list project developed using Ruby on Rails.

Tags: Ruby, Rails

Languages: Ruby
