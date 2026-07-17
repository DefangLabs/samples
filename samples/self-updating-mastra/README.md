# Self-updating Mastra Todo

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-self-updating-mastra-template%26template_owner%3DDefangSamples)

This sample is a multi-user Next.js todo app that turns user feedback into live
code changes. Better Auth and PostgreSQL provide accounts, private todo lists,
and feedback storage. The first person to sign up becomes the administrator.
From the admin page, that person can curate feedback, add instructions, and send
the request to a Mastra coding agent that edits the app source while the Next.js
development server hot-reloads it.

The Compose project separates the public production app from the live-editing
environment:

- `app` is a standalone Next.js production build with no source, agent, or admin UI.
- `dev` contains the source, Caddy, the Next.js dev server, and the Mastra agent.
- `db` is shared PostgreSQL for auth, todos, and feedback.
- `chat` is the managed Gemini model used by the coding agent on GCP.

The **admin console is served by the agent server, not the Next.js app** — it
lives outside the source tree the coding agent edits. Caddy routes `/admin` to
the agent server and everything else to Next.js, so the console stays usable to
recover the app even if a bad edit crashes the Next.js dev server.

> [!WARNING]
> This is a demo of agent-driven development, not a production software-update
> design. The coding agent can change any file under `todo-app/`. The admin gate,
> source boundary, and compile check reduce risk, but they are not a substitute
> for code review, tests, signed artifacts, or a deployment approval process.

## Prerequisites

1. Download the [Defang CLI](https://github.com/DefangLabs/defang).
2. Authenticate with a GCP project that can use Vertex AI.
3. For local development, install Docker Desktop with
   [Docker Model Runner](https://docs.docker.com/ai/model-runner/) enabled.

## Development

Start the live-editing environment, PostgreSQL, and the local model:

```bash
docker compose -f compose.dev.yaml up --build
```

Then open `http://localhost:3000` and:

1. Sign up. The first account becomes the administrator.
2. Add a few todos.
3. Use the feedback button in the lower-right corner.
4. Open **Admin**, select feedback, add instructions, and choose
   **Send to coding agent**.
5. Watch the run log. Successful edits appear in `todo-app/` and hot-reload in
   the browser.

The local model is `ai/qwen2.5-coder:7B-Q4_K_M`. It is intentionally small so
the workflow can run on a laptop; use local development to test the loop, not to
judge the quality of the generated changes. The first run downloads the model.

## Configuration

Set these secrets before deploying:

```bash
defang config set POSTGRES_PASSWORD --random
defang config set BETTER_AUTH_SECRET --random
defang config set ADMIN_TOKEN --random
```

- `POSTGRES_PASSWORD` protects the managed PostgreSQL database.
- `BETTER_AUTH_SECRET` signs and encrypts authentication data. Keep it stable
  across deployments or existing sessions will be invalidated.
- `ADMIN_TOKEN` is a break-glass password for the admin console. The console
  normally accepts your regular admin login (its session is validated directly
  against PostgreSQL, so it works even while the app is down); the token is the
  fallback for when no valid session is available.

## Deployment to GCP

The deployed model is `gemini-2.5-flash` through Vertex AI. Select a GCP project
and a region where that model is available; `europe-west2` is the configuration
used for this sample's London demo.

```bash
export DEFANG_PROVIDER=gcp
export GCP_PROJECT_ID=your-gcp-project
export GCP_LOCATION=europe-west2

defang compose up
```

The first deployment creates managed PostgreSQL and can take about 20 minutes.
Defang reports separate URLs for `app` and `dev`:

- Share the `app` URL with normal users.
- Use the `dev` URL for administration and live agent changes.

The `dev` service deliberately runs as one always-on Compute Engine instance so
its working tree survives idle periods. The `app` service remains a stateless
production build.

## Publishing (self-redeploy)

The admin console's **Publish** panel promotes the live, agent-edited workspace
into a new production build — by having the dev container run
`defang compose up` on its own Compose project, overwriting **both** the `dev`
and `app` services. There is deliberately no GitOps pipeline: the deployed app
mutates its own deployment.

- **Authorization is per publish.** Clicking Publish starts an interactive
  `defang login` inside the container; the console surfaces the login URL in a
  new tab and the admin must complete it for every deployment. No Defang token
  is stored anywhere. After login, the panel shows who you are signed in as —
  make sure it is the tenant that owns this stack — before the final
  "Deploy and overwrite" button.
- **Cloud credentials are ambient, not baked.** The `dev` service's own
  service account is granted the deploy roles in `compose.yaml` via
  `x-defang-roles`, and the CLI picks it up from the metadata server.
- **History survives.** The workspace's git history (one commit per agent run,
  one per publish, each referencing the database rows it addressed) rides
  along in the build context, so the next dev container continues the same
  lineage.
- `PUBLISH_STACK` in `compose.yaml` must match the stack the project was
  deployed with; publishing is disabled in local development.

## Run history and revert

Every successful agent run is committed to the workspace's local git repo with
trailers (`Run-Id`, `Feedback-Id`, `Model`) linking it to the run and feedback
rows in Postgres; failed runs are rolled back to the last good commit. The
admin console's **History** panel lists the lineage, links agent commits to
their run logs, and offers an admin-only revert (a new commit authored as the
admin). Runs can be graded on demand ("Grade this run") with a second model
call.

## Safety boundaries

- The Mastra Workspace filesystem is rooted at `todo-app/`; it cannot edit its
  own agent server.
- The agent listens only on `127.0.0.1` inside `dev`.
- Next.js server routes validate the Better Auth session and admin role before
  dispatching or reading agent runs.
- Every run ends with `tsc --noEmit`. A failed check triggers one repair attempt
  and is reported as failed if the app still does not compile.
- The production `app` image contains neither the coding agent nor application
  source files.

---

Title: Self-updating Mastra Todo

Short Description: A Next.js todo app where an admin can turn stored user feedback into live code changes with a Mastra coding agent.

Tags: Mastra, Next.js, PostgreSQL, Better Auth, AI, Agents

Languages: TypeScript, JavaScript, Docker
