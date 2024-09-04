# Vue.js

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/)

This sample shows how to get a minimal Vue.js app up and running with Defang.

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/) to describe the basic image of your applications.
2. A [docker-compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications.
3. A [.dockerignore](https://docs.docker.com/build/building/context/#dockerignore-files) file to comply with the size limit (10MB).

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
   Plus, make sure that you have properly set your environment variables like `AWS_PROFILE`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

---

Title: Vue.js

Short Description: A minimal Vue.js app running on Defang.

Tags: Vue.js, Vite, Node.js, Frontend, JavaScript

Languages: javascript

