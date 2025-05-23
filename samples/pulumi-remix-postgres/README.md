# Pulumi & Remix & Postgres

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-pulumi-remix-postgres-template%26template_owner%3DDefangSamples)

In this example, we run a Remix application connected to a Postgres database using Prisma as an ORM. When we deploy our service to [Defang](https://defang.io/), we also deploy a Postgres service and database using [Aiven](https://aiven.io/) so we can run our full application in the cloud.

## Running Locally

To run this example locally, you'll need to have a Postgres database. You can run one locally with Docker:

```
docker run -p 5432:5432 -e POSTGRES_PASSWORD=password -d postgres
```

Create a `.env` file with the following:

```
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"
```

Then run `npm install` and `npm run dev` in the `remix` directory to start the application.

## Deploying to Defang

First, `cd` into the `pulumi` directory and make sure you're logged into Defang with `defang login` and into Pulumi with `pulumi login`.

Next, head to your Aiven account and create an api token, then run the following command to store it in your Pulumi stack config:

```
pulumi config set --secret aiven:apiToken <YourToken>
```

You'll also need to make sure you have an Aiven organization with a billing method attached to a billing group. Get the organization id and the billing group id and add them to your config with the following commands:

```
pulumi config set --secret aivenOrganizationId <OrgId>
pulumi config set --secret aivenBillingGroupId <BillingGroupId>
```

Now, run `pulumi up` to deploy your application to Defang and Aiven! Head to the [portal](https://portal.defang.dev) to check on status, or run `defang services`.

---

Title: Pulumi & Remix & PostgreSQL

Short Description: A full-stack example using Remix, Prisma, and Aiven.

Tags: Full-stack, Remix, Prisma, Aiven, PostgreSQL, Pulumi, Node.js, TypeScript, SQL

Languages: nodejs
