# Node.js & Express

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nodejs-express-template%26template_owner%3DDefangSamples)

This Node.js application, built with Express.js, is designed to inspect and display detailed information about incoming HTTP requests. It supports all HTTP methods and provides insights into the request path, method, headers, query parameters, and body. Note alongside your project, you should also include a package.json file that includes the relevant metadata such as package dependencies, scripts, project verrsions so that the Dockerfile can install necessary dependencies.

## Essential Setup Files

1. A [Dockerfile](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/).
2. A [compose file](https://docs.defang.io/docs/concepts/compose) to define and run multi-container Docker applications (this is how Defang identifies services to be deployed).

## Prerequisite

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc), make sure you have properly [authenticated your AWS account (optional)](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)

## A Step-by-Step Guide

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Your app should be up and running with Defang in minutes!

---

Title: Node.js & Express

Short Description: A Node.js application that inspects and displays detailed information about incoming HTTP requests.

Tags: Node.js, Express, HTTP, Request, Inspector, JavaScript

Languages: nodejs
