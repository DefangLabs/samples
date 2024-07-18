# Ruby on Rails

This template is a member list project developed using Ruby on Rails, offering a starting point to help you quickly build your team management system. We have prepared all the essential files for deployment. By spending less than 10 minutes setting up the environment, as detailed in the prerequisites, and executing the commands in our step-by-step guide, your website will be ready to go live to the world!

## NOTE

This sample showcases how you could deploy a full-stack application with Defang in Ruby on Rails. However, it uses a SQLite database, which isn't production-ready and will be reset with every deployment. For production use cases you should use a managed database like RDS, Aiven, or others. If you stick to Rail's default SQLite database, your stored data will be lost on every deployment, and in some other cases. In the future, Defang will help you provision and connect to managed databases.

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to describe the basic image of your applications.
2. A [docker-compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications.
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) file to comply with the size limit (10MB).

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
3. Plus, make sure that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

## Deployment

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Now your application will be launched

---

Title: Ruby on Rails

Short Description: A basic member list project developed using Ruby on Rails

Tags: Ruby, Rails

Languages: Ruby
