# Mastra Server

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.io/sample/mastra-server)

Self-host the [Mastra](https://mastra.ai/) server — the agent API and the Studio UI — in your own cloud account, from one Docker Compose file.

Mastra publishes a [Helm chart](https://mastra.ai/blog/introducing-mastra-helm-chart) for teams who want to run Mastra themselves on Kubernetes. This sample runs the same server, without the cluster. You get a managed PostgreSQL database, a managed model endpoint, TLS, and a public URL from `defang compose up`.

The other Mastra samples in this repository ([mastra-nextjs](../mastra-nextjs), [mastra-extended](../mastra-extended), [self-improving](../self-improving)) embed Mastra inside a Next.js app. This one deploys the Mastra server on its own, so other applications can call it over HTTP.

You get one agent with a tool and conversation memory, the Studio UI on the same URL, durable state in a managed PostgreSQL database, and a managed model endpoint — so no model provider API key is stored anywhere. A token protects both the API and Studio.

## How this compares to the Helm chart

Both approaches run the same artifact: the output of `mastra build --studio`. They differ in what you must operate.

| The Helm chart needs | This sample uses |
|---|---|
| Kubernetes 1.27+ and Helm 3.8+ | Nothing. `defang compose up` |
| A PostgreSQL database you provision and connect | `x-defang-postgres: true` |
| cert-manager and a `ClusterIssuer` for TLS, installed by the chart or by you | Defang requests the certificate |
| An ingress controller, or Gateway API CRDs and a controller | `mode: ingress` |
| `global.cloud: gke \| eks \| aks \| generic \| local` | `--provider aws \| gcp \| azure` |
| A container registry, plus `imagePullSecrets` | Defang builds the image from source |
| An `OPENAI_API_KEY` in the chart's `mastra-app-env` Secret | A managed model. No provider key |
| A `MASTRA_EE_LICENSE` in that same Secret | Not needed. This sample is Apache-2.0 Mastra |
| `values.yaml`, an umbrella chart with three sub-charts, and a dozen-plus resources | One `compose.yaml` |

> [!NOTE]
> The Mastra Helm chart is for Mastra Enterprise customers. It is served from a private registry and needs a licence key. This sample uses only the Apache-2.0 parts of Mastra, so anyone can deploy it. Enterprise features such as Agent Builder, RBAC, fine-grained authorization, and SSO are not included here.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development

Run the server locally with a local database and a local model:

```bash
docker compose -f compose.dev.yaml up --build
```

Then open Studio at [http://localhost:4111](http://localhost:4111).

Local development uses `ai/gemma3:1B-Q4_K_M` through Docker Model Runner. The first run downloads the model, so it can take a few minutes. If the run fails with `exec: "model": executable file not found in $PATH`, your Docker installation does not have Docker Model Runner enabled.

Authentication is off locally, so Studio opens without a login prompt. Set `MASTRA_API_TOKEN` in `compose.dev.yaml` if you want to exercise the login path.

## Configuration

For this sample, you will need to provide the following [configuration](https://docs.defang.io/docs/concepts/configuration).

### `POSTGRES_PASSWORD`

The password for the PostgreSQL database. Set it before your first deployment.

```bash
defang config set POSTGRES_PASSWORD --random
```

### `MASTRA_API_TOKEN`

The token that protects the agent API and the Studio UI.

```bash
defang config set MASTRA_API_TOKEN --random
```

`compose.yaml` declares this value with no default, so Defang refuses to deploy until you set it. That is deliberate: an agent endpoint on the public internet with no token lets anyone run your agents and spend your model budget. Read the token back with `defang config get MASTRA_API_TOKEN`.

## Usage

Get your deployment URL from `defang compose up` or `defang ps`.

Call the agent:

```bash
curl -X POST https://<your-url>/api/agents/assistantAgent/generate \
  -H "Authorization: Bearer $MASTRA_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messages": "Which instance answered this, and how long has it been up?"}'
```

Open Studio in a browser at `https://<your-url>` and sign in with the same token.

The `serverInfo` tool reports which container answered, so you can see the effect of running more than one replica. The agent also remembers earlier turns in a conversation, because memory is stored in PostgreSQL rather than in the container.

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

Deploy to your own cloud account with [Defang BYOC](https://docs.defang.io/docs/tutorials/deploy-to-your-cloud). Managed PostgreSQL and managed models both run in your account, so this sample is written for BYOC:

```bash
defang compose up --provider aws
```

Change `--provider` to `gcp` or `azure` to deploy the same file elsewhere. Nothing in `compose.yaml` is provider-specific.

## Scaling beyond one instance

This sample runs one instance, which is also the Helm chart's default. Mastra's [worker documentation](https://mastra.ai/docs/deployment/workers) explains what to add before you scale up, and each item maps onto a Compose change:

1. **Move state out of the container.** Already done — `x-defang-postgres: true`.
2. **Add distributed pub/sub.** Add a Redis service with `x-defang-redis: true` and configure `RedisStreamsPubSub` from `@mastra/redis-streams`. Defang maps this to ElastiCache, Memorystore, or Azure Managed Redis.
3. **Split the workers.** Run the same image more than once. Set `MASTRA_WORKERS=false` on the API service, then add separate services for `MASTRA_WORKERS=orchestration`, `scheduler`, and `backgroundTasks`.
4. **Keep exactly one scheduler.** Two schedulers fire every cron job twice. Give the scheduler service `deploy: replicas: 1`.
5. **Turn on autoscaling.** Add `x-defang-autoscaling: true` to the API service and remove any `replicas` from its `deploy` mapping. This replaces the chart's `HorizontalPodAutoscaler`. It needs AWS or GCP, staging or production mode, and a Defang Pro plan or higher.

Mastra's checklist also asks for a shared cache (`RedisServerCache`), durable agents for long-running workflows, and a first run on one replica so the database schema is created before you scale.

Autoscaling is deliberately off in this sample. Turning it on before steps 2 to 4 would run several schedulers at once.

## Security notes

- **The API token is the only gate.** `SimpleAuth` checks a static token. For real user identity, swap it for one of Mastra's [auth providers](https://mastra.ai/docs/auth/overview) — JWT, Clerk, WorkOS, Auth0, Firebase, or Supabase. Change `getAuth()` in `app/src/mastra/index.ts`. Note that Mastra needs an Enterprise licence to run third-party auth providers in production. `SimpleAuth` does not.
- **`/health` is public on purpose.** The container health check and the cloud load balancer both call it without credentials. It returns no application data.
- **No model provider key exists.** Defang injects a gateway credential, not a provider key, so there is no long-lived Bedrock, Vertex AI, or Foundry key in the deployment to leak or rotate. Defang configures the cloud roles and permissions for you.
- **The database is not a public service.** On BYOC, `x-defang-postgres: true` replaces the container with a managed instance inside your project's network. Take care if you copy this pattern for an unmanaged container: in Defang, [networks](https://docs.defang.io/docs/concepts/networking) decide whether a service is reachable from the internet, and `mode: host` only means "no load balancer", not "private".
- **Studio is an admin surface.** It can run agents and read traces. It is protected by the same token as the API, so treat that token as an administrator credential.

---

Title: Mastra Server

Short Description: Self-host the Mastra agent server and Studio UI with managed PostgreSQL and a managed model, as an alternative to the Mastra Helm chart.

Tags: Mastra, AI, Agents, PostgreSQL, Studio, Self-Hosted, Kubernetes-Alternative

Languages: nodejs, TypeScript
