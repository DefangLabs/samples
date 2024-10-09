# ASP.NET Core & JavaScript Task Manager

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-csharp-dotnet-template%26template_owner%3DDefangSamples)

This project is a simple task manager application using ASP.NET Core for the backend and JavaScript for client-side component rendering. We show case how to deploy it to both defang and docker for both prod and dev environments.

## NOTE

This sample showcases how you could deploy a full-stack application with ASP.NET Core and JavaScript using Defang. The Docker setup ensures the app can be easily built and tested during development.

## Essential Setup Files

1. Download [Defang CLI](https://github.com/defang-io/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) authenticated with your AWS account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Prerequisites

1. Download [Defang CLI](https://github.com/defang-io/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html) make sure you have properly authenticated your AWS account
3. [ASP.NET Core](https://dotnet.microsoft.com/download/dotnet-core)

## A Step-by-Step Guide for deployment

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI
3. Your app should be up and running with Defang in minutes!

## Development

For development, we use two local containers, one for the frontend service and one for the backend service in ASP.NET Core. It also uses Caddy as a web server for serving static files. To run the sample locally after cloning the repository, you can run on Docker by doing:

`docker compose -f compose.dev.yaml up --build`

---

Title: ASP.NET Core & JavaScript Task Manager

Short Description: A task manager using ASP.NET Core for the backend and JavaScript for the frontend, containerized with Docker.

Tags: ASP.NET Core, JavaScript, C#

Languages: C#, JavaScript
