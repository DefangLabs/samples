# Flask

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-flask-template%26template_owner%3DDefangSamples)

This is a sample of a basic Flask TODO app. The items are stored in memory and are lost when the server is restarted, but it should give you a basic idea of how to get started with Flask on Defang. Note that alognside your .py file, include a requirements.txt so that the Dockerfile can install the necessary packages with pip.

### NOTE:

This sample is a simple Flask app that demonstrates how to create a TODO app using Flask. The items are stored in memory and are lost when the server is restarted. This sample is intended to provide a basic understanding of how to get started with Flask on Defang. **it is not intended for production use**. If you need something production ready, you should use a managed database like Postgres or MySQL.

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/).
2. A [compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications (this is how Defang identifies services to be deployed).
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) to ignore files that are not needed in the Docker image or will be generated during the build process.

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account (optional)](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

## A Step-by-Step Guide

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Your app should be up and running with Defang in minutes!

## One click deployment

---

Title: Flask

Short Description: A basic Flask to o app.

Tags: Flask, Python

Languages: python
