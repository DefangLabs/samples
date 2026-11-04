# Customer Installation Handoff

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.io/sample/customer-handoff)

This server-backed sample starts a Defang Installation handoff after a
developer-owned signup, payment, or entitlement event. It keeps the Portal
credential on the server, creates or reuses a pending installation, and sends
the customer to the exact hosted setup URL returned by Defang.

> [!IMPORTANT]
> The merged Portal contract currently requires a short-lived developer bearer
> token. Durable project-scoped machine credentials, credential rotation, a
> public status API, signed callbacks, and provider-verified revocation are
> tracked in [Portal issue #1086](https://github.com/DefangLabs/portal/issues/1086)
> and [Portal issue #1087](https://github.com/DefangLabs/portal/issues/1087);
> they are not available contracts yet. This sample is a current-contract
> foundation for evaluation, not an
> unattended production integration.

## Responsibility boundary

- Your application owns signup or payment, the customer relationship, the
  external order/entitlement reference, and the database mapping that reference
  to the returned `installationId`.
- The sample calls Defang only after that business event has been verified. It
  sends no payment amount, product, receipt, or payment-provider data to Defang.
- Defang hosts customer sign-in and cloud trust setup. After setup completes,
  Portal creates the stack and automatically dispatches the developer project's
  deployment workflow.
- The customer owns the cloud account and approves the OIDC trust that the
  deployment workflow uses.

The public form exists only to make the boundary visible. A real application
must take the email and external reference from its authenticated backend and
persist the correlation before redirecting the customer.

## Current behavior

The sample derives a stable, opaque installation name from the external
reference. Retrying with the same customer and configuration therefore sends an
identical request; Portal returns the existing installation and handoff URL.
The raw external reference remains in the developer's system.

The create response contains only the initial installation `status`. Portal does
not yet expose a supported third-party polling or callback contract. Deployment
is dispatched after the customer finishes setup, but later workflow transitions
are not continuously reconciled, so use Portal and GitHub Actions to inspect the
result during evaluation.

## Prerequisites

1. Install Docker Compose for the container workflow, or Node.js 22 or newer for
   the focused contract tests.
2. Have a Defang developer workspace with a project whose deployment workflow is
   configured for the chosen GitHub repository.
3. Obtain a current, short-lived Portal bearer token for that developer account.
4. Use a customer email inbox and test cloud account you control.

## Configuration

Set configuration in the server environment. Never put `PORTAL_ACCESS_TOKEN` in
client-side code, a committed file, a URL, or logs.

| Variable | Required | Purpose |
| --- | --- | --- |
| `PORTAL_ACCESS_TOKEN` | Yes | Current short-lived developer bearer token; server only |
| `DEFANG_TENANT_ID` | Yes | Developer workspace UUID |
| `DEFANG_PROJECT_ID` | Yes | Project UUID owned by that workspace |
| `GITHUB_ORG` | Yes | GitHub owner of the configured repository |
| `GITHUB_REPOSITORY` | Yes | Exact repository name; wildcards are not used |
| `PORTAL_GRAPHQL_URL` | No | Defaults to `https://graphql.defang.io/v1/graphql` |
| `PORTAL_HANDOFF_ORIGIN` | No | Allowed redirect origin; defaults to `https://portal.defang.io` |
| `DEFANG_CLOUD_PROVIDER` | No | `aws`, `gcp`, or `azure`; defaults to `aws` |
| `DEFANG_RECIPE` | No | Defaults to `default` |
| `DEFANG_STACK_NAME` | No | Defaults to `production` |
| `GITHUB_REF_TYPE` | No | `all`, `branch`, or `environment`; defaults to `environment` |
| `GITHUB_REF_PATTERN` | For branch/environment | Defaults to `defang-production`, matching stack `production` |
| `INSTALLATION_NAME_PREFIX` | No | Non-secret installation-name prefix; defaults to `customer` |

For Portal's dev environment, use these matching endpoint values together:

```sh
export PORTAL_GRAPHQL_URL=https://graphql.dev.gnafed.click/v1/graphql
export PORTAL_HANDOFF_ORIGIN=https://portal.dev.gnafed.click
```

## Development

Export all required values in your shell, then run:

```sh
docker compose up --build
```

Open `http://localhost:8080`, enter a test customer email and external
reference, and submit the form. The backend will create or reuse the handoff and
respond with `303 See Other` to the exact `handoffUrl` returned by Portal.

To test safely without a live credential or cloud account, run the contract tests.
They replace Portal at the HTTP boundary and cover request shape, idempotent
replay, redirect preservation, allowed-origin validation, and log redaction:

```sh
cd app
npm test
```

## End-to-end evaluation

1. Configure the sample for a real project and a test customer email.
2. Submit one external reference and record the returned redirect.
3. Submit the same reference and email again. Portal should reuse the same
   installation and return the same redirect.
4. Sign in at the returned URL as the customer and complete cloud trust setup.
5. Confirm the configured deployment workflow starts in GitHub Actions.
6. Inspect the installation in Portal for the initial deployment result.

Known current limitations:

- The developer token expires and cannot be rotated or scoped as a machine
  credential. Do not deploy this sample as an unattended service yet.
- Idempotency is based on the customer workspace plus derived installation name,
  not a first-class vendor key. Enforce uniqueness and payload consistency in
  your own database too.
- The external reference is not stored by Defang. Persist the returned
  `installationId` in the same transaction as your local handoff state.
- There is no supported partner callback or polling endpoint yet.
- Setup links have no partner-controlled expiry/cancellation contract.
- Deployment dispatch is at-most-once, but `dispatching`/`unknown` outcomes do
  not yet have an automatic reaper, and later workflow status is not reconciled.
- Customer self-service trust revocation and uninstall are not yet available.

## Deployment

The Compose file is deployable, but the current short-lived authentication
contract makes an unattended deployment unsuitable. When project-scoped machine
credentials ship, set the credential through environment configuration rather
than changing the browser or checking a secret into the repository:

```sh
defang compose up
```

---

Title: Customer Installation Handoff

Short Description: A server-backed foundation for handing customer cloud setup and deployment to Defang.

Tags: Defang, Customer Onboarding, Cloud, GitHub, Sample

Languages: nodejs, html, css, javascript
