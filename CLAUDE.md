# Defang Samples

This repository contains 80+ example applications demonstrating how to deploy with [Defang](https://defang.io). Each sample is a self-contained project showing a specific framework, language, or integration pattern deployed via Docker Compose.

---

## Repository Structure

```
samples/                     <- Root
├── samples/                 <- All sample projects live here
│   ├── flask/               <- Example: simple Flask app
│   ├── nextjs/              <- Example: Next.js app
│   ├── django-postgres/     <- Example: multi-service with DB
│   └── ...                  <- 80+ samples total
├── starter-sample/          <- Template used by `new-sample` script
├── scripts/                 <- Tooling (new-sample, validation, list generation)
├── templates/               <- GitHub Actions deploy workflow template
├── tools/testing/           <- Go-based load test tool for CI deploy testing
├── .github/workflows/       <- CI workflows
├── README.md                <- Auto-generated samples table
└── .gitignore               <- Ignores `.defang/` directories
```

### Key Directories

- **`samples/`** -- Every sample lives in its own kebab-case subdirectory here. Never place samples at the repo root.
- **`starter-sample/`** -- The scaffold copied by `. ./scripts/new-sample`. Contains `compose.yaml`, `compose.dev.yaml`, `README.md`, `.devcontainer/`, and `.github/workflows/deploy.yaml` with `#REMOVE_ME_AFTER_EDITING` markers.
- **`scripts/`** -- Automation scripts (Node.js). Run `npm ci` in this directory before using.
- **`templates/deploy.yaml`** -- The canonical deploy workflow. Each sample gets a copy managed by `template-manager.js` (do NOT manually create or edit `samples/*/.github/workflows/deploy.yaml`).
- **`tools/testing/`** -- Go load test tool used by CI to deploy changed samples to staging and verify they come up healthy.

---

## Sample Anatomy

Every sample MUST contain:

### 1. `compose.yaml` (required)

The Docker Compose file that Defang uses to deploy the application.

**Conventions:**
- The top-level `name:` field MUST match the sample's directory name (e.g., `name: flask` for `samples/flask/`)
- Use `mode: ingress` for user-facing HTTP ports
- Use `mode: host` for internal-only ports (e.g., databases)
- Include a `healthcheck` for services with published ports (use `curl`, `wget`, or language-native checks)
- Include `deploy.resources.reservations` to specify CPU and memory
- Use `restart: unless-stopped` for long-running services
- Secrets go in `environment:` with no value (e.g., `POSTGRES_PASSWORD:`) so Defang prompts for them via `defang config set`
- Use `x-defang-postgres: true` on Postgres services for Defang managed Postgres
- Source code typically lives in a subdirectory (e.g., `./app`, `./flask`) with the `build.context` pointing there

**Example:**
```yaml
name: my-sample
services:
  app:
    restart: unless-stopped
    build:
      context: ./app
      dockerfile: Dockerfile
    ports:
      - target: 3000
        published: 3000
        mode: ingress
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/"]
    deploy:
      resources:
        reservations:
          cpus: "0.5"
          memory: 256M
```

### 2. `README.md` (required)

Must follow the established template structure:

```markdown
# Sample Title

[![1-click-deploy](https://raw.githubusercontent.com/DefangLabs/defang-assets/main/Logos/Buttons/SVG/deploy-with-defang.svg)](https://portal.defang.dev/redirect?url=https%3A%2F%2Fgithub.com%2Fnew%3Ftemplate_name%3Dsample-<DIRNAME>-template%26template_owner%3DDefangSamples)

Description of what this sample does.

## Prerequisites

1. Download [Defang CLI](https://github.com/DefangLabs/defang)
2. (Optional) If you are using [Defang BYOC](https://docs.defang.io/docs/concepts/defang-byoc) authenticate with your cloud provider account
3. (Optional for local development) [Docker CLI](https://docs.docker.com/engine/install/)

## Development
...

## Configuration
...

## Deployment

> [!NOTE]
> Download [Defang CLI](https://github.com/DefangLabs/defang)

### Defang Playground
...

### BYOC (AWS)
...

---

Title: Human-Readable Title

Short Description: One or two sentences.

Tags: Framework, Tool, Category

Languages: python, nodejs, golang, etc.
```

**Required metadata fields** (at the bottom, after `---`):
- `Title:` -- Used in the auto-generated samples table
- `Short Description:` -- One-line summary
- `Tags:` -- Comma-separated; frameworks, tools, categories (NOT programming languages)
- `Languages:` -- Comma-separated programming languages/runtimes

The 1-click deploy badge URL must use `sample-<DIRNAME>-template` as the `template_name` (this is auto-managed by `template-manager.js`).

### 3. Source code directory (required)

Application source code in a subdirectory (commonly `app/`, or named after the framework like `flask/`). Must include a `Dockerfile` unless using a pre-built image.

### 4. `compose.dev.yaml` (optional)

For local development with hot-reload and local dependencies (like a local MongoDB). Should use `extends` to inherit from `compose.yaml`.

### 5. `.devcontainer/` (optional, included in starter)

Devcontainer config for GitHub Codespaces / VS Code. The starter includes the Defang CLI feature, Docker-in-Docker, and AWS CLI.

### 6. `.github/workflows/deploy.yaml` (auto-generated)

Do NOT create this manually. It is generated from `templates/deploy.yaml` by `template-manager.js` during CI. Pulumi samples are an exception and may have custom workflows.

---

## Creating a New Sample

1. From the repo root, run:
   ```bash
   . ./scripts/new-sample
   ```
2. Enter a kebab-case name (e.g., `express-redis`)
3. The script copies `starter-sample/` to `samples/<name>/`
4. Search for `#REMOVE_ME_AFTER_EDITING` in the new directory and update/remove every marked section
5. Ensure `compose.yaml` has `name: <your-sample-name>` matching the directory name
6. Write your application code in the source subdirectory
7. Add a proper `Dockerfile`
8. Update the README metadata fields (`Title`, `Short Description`, `Tags`, `Languages`)
9. If the sample needs secrets/config values, add them to `deploy-changed-samples.yml` with `TEST_` prefix and set them in repo secrets
10. Test locally: `docker compose up --build`
11. Test with Defang: `defang compose up`
12. Run the validation script: `./scripts/check-sample-files.sh`
13. Update the samples table: `node scripts/generate-samples-list.js`

---

## CI/CD Workflows

### On Pull Request (paths: `samples/**`)

| Workflow | File | What it does |
|----------|------|--------------|
| **Check Samples** | `check-sample.yml` | Validates compose files, checks README metadata, flags `#REMOVE_ME_AFTER_EDITING`, manages template repos |
| **Deploy Changed Samples** | `deploy-changed-samples.yml` | Deploys changed samples to Defang staging using the Go load test tool, verifies they come up healthy |
| **Build Samples JSON** | `build-samples-json.yml` | Lints JS/TS files, triggers defang-docs rebuild |
| **Test Scripts** | `test-scripts.yml` | Runs `npm test` on the scripts package, previews workflow changes |

### Testing Locally

- **Validate structure:** `./scripts/check-sample-files.sh`
- **Build locally:** `docker compose -f samples/<name>/compose.yaml up --build`
- **Deploy to playground:** `cd samples/<name> && defang compose up`
- **Generate samples list:** `node scripts/generate-samples-list.js`

### Adding Config Values for CI Testing

If your sample requires secrets (e.g., `API_KEY`):
1. Add `TEST_API_KEY: ${{ secrets.TEST_API_KEY }}` to the env section of `deploy-changed-samples.yml`
2. Set `TEST_API_KEY` in the repository secrets

The test tool automatically strips the `TEST_` prefix and passes the values as Defang config.

---

## Conventions

### Naming
- Sample directories: **kebab-case** (e.g., `fastapi-postgres`, `nextjs-blog`)
- Compose service names: lowercase, short (e.g., `app`, `db`, `api`, `web`)

### Multi-Service Samples
- Use `depends_on` for service ordering
- Use `mode: host` for inter-service ports (databases)
- Use `mode: ingress` only for user-facing HTTP endpoints
- Reference other services by their compose service name in environment variables (e.g., `DB_HOST=db`)

### Language-Specific Patterns
- **Python:** Use `requirements.txt`, Flask/FastAPI/Django; healthcheck with `python3 -c "import urllib..."`
- **Node.js/TypeScript:** Use `package.json`; healthcheck with `wget -q --spider` or `curl -f`
- **Go:** Standard `go.mod`; healthcheck with `curl` or `wget`
- **Rust:** Use `Cargo.toml`; healthcheck with `curl`
- **Multi-language:** Use separate directories per service, each with its own Dockerfile

### Defang-Specific Extensions
- `x-defang-postgres: true` -- Use Defang managed Postgres
- `x-defang-static-files` -- Static file serving extension
- Pulumi samples use `Pulumi.yaml` instead of (or alongside) `compose.yaml`

### What NOT to Include
- No `.env` files with real secrets
- No `node_modules/`, `__pycache__/`, build artifacts
- No `.defang/` directory (already in `.gitignore`)
- No manually created `.github/workflows/deploy.yaml` (auto-generated from template)

---

## SAM (Simple Agent Manager) Integration

When running inside SAM (detected by `$SAM_WORKSPACE_ID` environment variable):

### Environment
- SAM environments are **ephemeral** -- push changes frequently to avoid losing work
- The Defang CLI may or may not be installed; do not assume it is available for testing

### Workflow
1. **Push often** -- Commit and push after completing each meaningful unit of work
2. **Report progress** -- Use `update_task_status` at milestones:
   - After creating a new sample scaffold
   - After completing the compose.yaml
   - After writing the README
   - After validating with `check-sample-files.sh`
4. **Capture ideas** -- Use `create_idea` for new sample ideas discovered during work (e.g., "sample for Framework X with Database Y")
5. **Search context** -- Use `search_messages` to find prior conversations about sample conventions or specific frameworks

### Knowledge Graph

SAM maintains a persistent knowledge graph across sessions. Use it to preserve non-obvious context:

- **`add_knowledge`** — Store observations about:
  - User preferences and work style (entityType: `preference`)
  - Sample conventions not captured in CLAUDE.md (entityType: `style`)
  - Project context: feature launches, deprecations, new framework support (entityType: `context`)
- **`search_knowledge`** — Query before key decisions (e.g., search "PlaygroundDeprecation" before referencing Playground, search "ContentStyle" before writing sample READMEs)
- **`update_knowledge`** / **`remove_knowledge`** — Fix stale or incorrect observations
- **`confirm_knowledge`** — When you verify an existing observation is still accurate

Do NOT store: patterns derivable from existing samples, git history, ephemeral task details, or anything already in CLAUDE.md.

### Important Notes
- Samples MUST use **current Defang CLI syntax and features** -- check the latest Defang docs if unsure about command syntax
- Use `defang compose up` (not deprecated alternatives)
- Use `defang config set` for secrets (not environment files)
- The deploy workflow uses `DefangLabs/defang-github-action@v1.4.0`

---

## Quick Reference

### Common Commands

```bash
# Create a new sample
. ./scripts/new-sample

# Validate all samples
./scripts/check-sample-files.sh

# Regenerate the samples table in README.md
node scripts/generate-samples-list.js

# Test a sample locally
docker compose -f samples/<name>/compose.yaml up --build

# Deploy a sample to Defang Playground
cd samples/<name> && defang compose up

# Install script dependencies (needed for generate/template scripts)
cd scripts && npm ci
```

### PR Checklist

When submitting a new or modified sample:
- [ ] `compose.yaml` has `name:` matching directory name
- [ ] `compose.yaml` passes `defang compose config` validation
- [ ] README has all four metadata fields (`Title`, `Short Description`, `Tags`, `Languages`)
- [ ] No `#REMOVE_ME_AFTER_EDITING` markers remain
- [ ] No `.github/workflows/deploy.yaml` manually added (auto-generated)
- [ ] Sample builds and runs locally with `docker compose up --build`
- [ ] Config values added to `deploy-changed-samples.yml` if secrets are needed
- [ ] `node scripts/generate-samples-list.js` run if README metadata changed
