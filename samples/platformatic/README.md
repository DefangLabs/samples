# Platformatic App

This sample project demonstrates how to deploy a simplist Platformatic service that returns "Platformatic x Defang" when accessed. The project includes a Dockerized setup with Docker Compose, making it easy to deploy and manage the service.

Once your app is up and running, you can access it via the defined port (default is 3042). This service is designed to be simple, showcasing how to set up a basic Platformatic application and deploy it using Docker.

## Prerequisites

1. Download <a href="https://github.com/defang-io/defang">Defang CLI</a>
2. (optional) If you are using <a href="https://docs.defang.io/docs/concepts/defang-byoc">Defang BYOC</a>, make sure you have properly <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html">authenticated your AWS account</a>.

## Deploying

1. Open the terminal and type `defang login`
2. Navigate to the directory "app" with `cd ./app`
3. Type `defang compose up` in the CLI.
4. Your app will be running within a few minutes.

## Local Development

1. After cloning the repository and navigating to the root directory of the project, navigate to the directory called "app" with `cd app`
2. Run `docker compose -f compose.dev.yaml up --build`

---

Title: Platformatic

Short Description: A sample project showcasing a simple Platformatic service with Docker deployment.

Tags: Platformatic, Defang, Docker, Node.js, Service, JavaScript

Languages: nodejs
