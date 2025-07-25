# Next.js

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-nextjs-template%26template_owner%3DDefangSamples)

A basic Next.js app with a Dockerfile and compose.yaml ready to deploy to AWS with [Defang](https://defang.io).

## Steps

1. [Install Defang](https://docs.defang.io/docs/getting-started/installing)
2. [Authenticate with Defang](https://docs.defang.io/docs/getting-started/authenticating)
3. (optional) [Authenticate with AWS](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html)
4. Run `defang compose up` in the root of this project

## Static Files (Experimental)

This example supports deployment to AWS as a static site. Static files will be copied to an S3 bucket. In the _affordable_
deployment mode (the default), the static files will be served over HTTP from an S3 bucket.

:::info
Note that some top-level domains (TLDs), such as `.app`, require HSTS, which will disallow browsers from accessing the site over HTTP. If you want to use such a TLD, you must serve the static files over HTTPS by using either the _balanced_ or _high_availability_ deployment mode.
:::

To serve the static files over HTTPS, use either the _balanced_ or _high_availability_ deployment mode, which will create a CloudFront distribution in front of the S3 bucket.

To deploy this project as a static site, run:

```bash
defang compose up -f compose.static.yaml --provider=aws --mode=balanced
```

---

Title: Next.js

Short Description: A basic Next.js app.

Tags: Next.js, React, Docker, Node.js, TypeScript, JavaScript, Static

Languages: nodejs
