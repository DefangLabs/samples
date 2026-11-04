# Programmatic Customer Handoff

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.io/sample/customer-handoff)

This demo shows how a software provider can create a hosted cloud-setup handoff for a customer. The provider chooses one of its Defang projects and defines the GitHub trust boundary. Defang creates the pending customer installation and returns a link where the customer signs in and connects their cloud account.

The application calls Portal from its Node.js backend. For short-lived manual testing, the demo accepts a token in the browser, forwards it to its own backend, and never saves or logs it. A production integration should obtain the developer credential through its existing authenticated server flow instead.

> [!IMPORTANT]
> The current Portal API accepts an existing developer bearer token. Durable machine credentials are outside the scope of the initial API, so this sample is a demonstration rather than an unattended production integration.

## Prerequisites

1. Open the repository in VS Code with Dev Containers.
2. Have a Defang developer account with an existing project.
3. Obtain a current Portal access token for that developer account.
4. For the customer-completion step, use an email inbox and cloud account you control.

## Development

Run the application locally:

```bash
docker compose up --build
```

Then open `http://localhost:8080`.

## Configuration

The demo targets the production Portal by default. To test Portal PR #1069 in the dev environment, set its GraphQL endpoint before starting the application:

```bash
PORTAL_GRAPHQL_URL=https://graphql.dev.gnafed.click/v1/graphql docker compose up --build
```

Do not commit access tokens. They expire and grant access to the developer workspace.

## Test the handoff

1. Load the developer workspaces and select a project.
2. Enter an email address you can access and a unique installation name.
3. Define the GitHub organization, repository pattern, and allowed reference.
4. Create the handoff.
5. Open the exact link returned by Portal and sign in with the same customer email.
6. Confirm the installation details, then connect a test cloud account.

Creating the handoff does not deploy a workload. Cloud setup creates the deployable stack. To test the broader deployment flow, deploy a small project through that stack and use a one-hour TTL so test resources are removed automatically.

Run the backend tests with:

```bash
cd app
npm test
```

## Deployment

Deploy the demo with:

```bash
defang compose up
```

The demo does not persist developer tokens and cannot make Portal requests without a token supplied for that request.

---

Title: Programmatic Customer Handoff

Short Description: A server-backed demo for creating customer cloud-setup handoffs with Defang Deploy.

Tags: Defang, Customer Onboarding, Cloud, GitHub, sample

Languages: nodejs, html, css, javascript
