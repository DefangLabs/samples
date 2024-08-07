# Next.js Boilerplate

[1-click deploy](https://github.com/new?template_name=sample-nextjs-boilerplate-template&template_owner=DefangSamples)

This template is a boilerplate project developed using Next.js, offering a starting point to help you quickly build your website. We have prepared all the necessary files for deployment. By spending just a few minutes setting up the environment, as detailed in the prerequisites, and executing the commands in our step-by-step guide, your website will be ready to go live in no time!

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to describe the basic image of your applications.
2. A [docker-compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications.
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) file to comply with the size limit (10MB).

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
   Plus, make sure that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

## A Step-by-Step Guide

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Now your application will be launched

---

Title: Next.js Boilerplate

Short Description: A boilerplate project developed using Next.js, offering a starting point to help you quickly build your website.

Tags: Next.js, React, Boilerplate, Website, Node.js, TypeScript, JavaScript

Languages: nodejs
