# C# & ASP.NET Core

[![1-click-deploy](https://defang.io/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-csharp-dotnet-template%26template_owner%3DDefangSamples)

This sample project is a simple task manager application using ASP.NET Core for the backend and JavaScript for client-side component rendering. 

It showcases how you could deploy a full-stack application with ASP.NET Core and JavaScript using Defang. The Docker setup ensures the app can be easily built and tested during development.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)
4. Install [ASP.NET Core](https://dotnet.microsoft.com/download/dotnet-core)

## Development

For development, we use two local containers, one for the frontend service and one for the backend service in ASP.NET Core. It also uses Caddy as a web server for serving static files.

To run the application locally, you can use the following command:

```bash
docker compose -f compose.dev.yaml up --build
```
## Configuration

For this sample, you will not need to provide [configuration](https://docs.defang.io/docs/concepts/configuration). 

If you wish to provide configuration, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
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
    ```

---

Title: C# & ASP.NET Core

Short Description: A simple task manager application using C# and ASP.NET Core.

Tags: ASP.NET Core, JavaScript, C#

Languages: C#