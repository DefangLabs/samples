# FastAPI

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-fastapi-template%26template_owner%3DDefangSamples)

This sample project demonstrates how to deploy FastAPI with Defang.

## Prerequisites

1. Download <a href="https://github.com/defang-io/defang">Defang CLI</a>
2. (optional) If you are using <a href="https://docs.defang.io/docs/concepts/defang-byoc">Defang BYOC</a>, make sure you have properly <a href="https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html">authenticated your AWS account</a>.

## Deploying

1. Open the terminal and type `defang login`
2. Type `defang compose up` in the CLI.
3. Your app will be running within a few minutes.

## Development

To run your FastAPI app locally, you'll need to have Docker installed on your machine. You can then run:

```bash
docker compose -f compose.yaml -f compose.dev.yaml up
```

That will start your FastAPI app on `http://localhost:8000` with hot reloading enabled.

---

Title: FastAPI

Short Description: A sample project demonstrating how to deploy FastAPI with Defang

Tags: FastAPI, OpenAPI, Python

Languages: python
