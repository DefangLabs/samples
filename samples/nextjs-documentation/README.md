# Nextra

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nextjs-documentation-template%26template_owner%3DDefangSamples)

This template is a documentation starter project developed using Nextra, designed to streamline the creation of your documentation and quickly build a digital knowledgebase. You can add content easily by simply adding markdown files. This code-free solution requires no adjustments to the basic structure. We have prepared all the essential files for deployment. By spending just a few minutes setting up the environment, as detailed in the prerequisites, and executing the commands in our step-by-step guide, your website will be ready to go live in no time!

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to describe the basic image of your applications.
2. A [docker-compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications.
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) file to comply with the size limit (10MB).

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
   Plus, make sure that you have properly set your environment variables like 
   `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
3. For any other config values that need to be set, please remember to configure with `defang config set API_KEY`

## A Step-by-Step Guide

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Now your application will be launched

---

Title: Nextra

Short Description: A documentation starter project developed using Nextra designed to streamline the creation of your documentation.

Tags: Next.js, Documentation, Nextra, Knowledgebase, Node.js, JavaScript, TypeScript

Languages: nodejs
