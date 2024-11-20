# Next.js

[![1-click-deploy](https://defang.io/deploy-with-defang.png)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nextjs-template%26template_owner%3DDefangSamples)

A basic Next.js app with a Dockerfile and compose.yaml ready to deploy to AWS with [Defang](https://defang.io).

## Steps

1. [Install Defang](https://docs.defang.io/docs/getting-started/installing)
2. [Authenticate with Defang](https://docs.defang.io/docs/getting-started/authenticating)
3. (optional) [Authenticate with AWS](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
4. Run `defang compose up` in the root of this project

## Configuration

For this sample, you will not need to provide [configuration](https://docs.defang.io/docs/concepts/configuration).

If you wish to provide configuration, see below for an example of setting a configuration for a value named `API_KEY`.

```bash
defang config set API_KEY
```

---

Title: Next.js

Short Description: A basic Next.js app.

Tags: Next.js, React, Docker, AWS, Node.js, TypeScript, JavaScript

Languages: nodejs
