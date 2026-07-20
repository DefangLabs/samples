import { execFile, spawn, type ChildProcess } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import { promisify } from "node:util";
import {
  appendDeploymentLog,
  createDeployment,
  setDeploymentCommit,
  setDeploymentStatus,
} from "./deployments.js";
import { commitPublish, REPO_DIR } from "./git.js";

const exec = promisify(execFile);

/**
 * Publish = this dev container redeploying its own Compose project with the
 * Defang CLI, overwriting BOTH the dev and app services from the current
 * (agent-edited) workspace.
 *
 * There is deliberately NO stored Fabric credential. Each publish starts an
 * interactive `defang login` whose auth URL is surfaced to the admin in a new
 * tab; the login's OAuth redirect goes to the auth server itself and the CLI
 * long-polls for the code, so the browser completing it can be anywhere. The
 * token lands in an ephemeral state dir that is deleted when the publish ends
 * — the human login ceremony IS the deploy authorization.
 *
 * Cloud credentials are ambient: the AWS task role or GCP VM service account
 * receives the grants in the stack-selected Compose overlay. The selected
 * `.defang/<stack>` file supplies provider/region and chooses the matching
 * `.env.<provider>` file again when this container redeploys itself.
 */

const STATE_DIR = "/run/defang-publish";
const LOGIN_TIMEOUT_MS = 10 * 60 * 1000; // matches the CLI's own poll timeout

export type PublishPhase =
  | "idle"
  | "awaiting-login"
  | "ready"
  | "deploying"
  | "cd-launched"
  | "failed"
  | "cancelled";

export interface PublishState {
  deploymentId: string | null;
  phase: PublishPhase;
  loginUrl: string | null;
  whoami: string | null;
  error: string | null;
  startedBy: string | null;
  logTail: string[];
}

const idleState = (): PublishState => ({
  deploymentId: null,
  phase: "idle",
  loginUrl: null,
  whoami: null,
  error: null,
  startedBy: null,
  logTail: [],
});

let state: PublishState = idleState();
let loginProc: ChildProcess | null = null;
let deployProc: ChildProcess | null = null;
let loginTimer: NodeJS.Timeout | null = null;

export function publishEnabled(): boolean {
  return process.env.PUBLISH_ENABLED === "true";
}

export function getPublishState(): PublishState {
  return state;
}

/** A publish owns the workspace from login start until the CLI hands off. */
export function isPublishActive(): boolean {
  return state.phase === "awaiting-login" || state.phase === "ready" || state.phase === "deploying";
}

function tail(line: string): void {
  state.logTail.push(line);
  if (state.logTail.length > 200) state.logTail.shift();
}

async function publishEnv(): Promise<NodeJS.ProcessEnv> {
  const provider = process.env.PUBLISH_PROVIDER;
  const stack = process.env.PUBLISH_STACK;
  if (!provider || !stack) {
    throw new Error("PUBLISH_PROVIDER and PUBLISH_STACK must be set by the selected stack env file");
  }

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    // Keep ALL CLI state (including the login token) in an ephemeral dir that
    // is wiped when the publish ends, and out of the build context.
    XDG_STATE_HOME: STATE_DIR,
    HOME: process.env.HOME || "/root",
  };

  if (provider === "gcp") {
    const projectId = process.env.GCP_PROJECT_ID || (await metadata("project/project-id"));
    if (!projectId) {
      throw new Error("GCP project ID unavailable: set GCP_PROJECT_ID or run on GCE");
    }
    env.GCP_PROJECT_ID = projectId;
  }

  return env;
}

async function metadata(path: string): Promise<string | undefined> {
  try {
    const res = await fetch(`http://metadata.google.internal/computeMetadata/v1/${path}`, {
      headers: { "Metadata-Flavor": "Google" },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return undefined;
    return (await res.text()).trim();
  } catch {
    return undefined;
  }
}

async function cleanupStateDir(): Promise<void> {
  await rm(STATE_DIR, { recursive: true, force: true }).catch(() => {});
}

function fail(message: string): void {
  state.phase = "failed";
  state.error = message;
  if (state.deploymentId) void setDeploymentStatus(state.deploymentId, "failed");
  if (state.deploymentId) void appendDeploymentLog(state.deploymentId, `\n${message}\n`);
  void cleanupStateDir();
}

/**
 * Phase 1: start `defang login` and surface its auth URL. Resolves as soon as
 * the URL is known; the login itself completes in the background and flips
 * the phase to "ready" (or "failed").
 */
export async function startPublish(adminEmail: string): Promise<PublishState> {
  if (isPublishActive()) return state;

  const env = await publishEnv(); // throws with an actionable message
  await cleanupStateDir();
  await mkdir(STATE_DIR, { recursive: true });

  const deploymentId = await createDeployment(adminEmail);
  state = {
    ...idleState(),
    deploymentId,
    phase: "awaiting-login",
    startedBy: adminEmail,
  };

  // --non-interactive=false forces the interactive URL+poll flow even though
  // this process has no TTY. Stdin stays open (the CLI only reads it to offer
  // "press Enter to open a browser"); we never write to it.
  loginProc = spawn("defang", ["login", "--non-interactive=false"], {
    cwd: REPO_DIR,
    env,
    stdio: ["pipe", "pipe", "pipe"],
  });
  const proc = loginProc;

  let buffer = "";
  const scrape = (chunk: Buffer) => {
    const text = chunk.toString();
    buffer += text;
    for (const line of text.split("\n")) if (line.trim()) tail(`[login] ${line.trim()}`);
    if (!state.loginUrl) {
      const match = buffer.match(/https?:\/\/\S+\/cli\/\S+/);
      if (match) state.loginUrl = match[0];
    }
  };
  proc.stdout?.on("data", scrape);
  proc.stderr?.on("data", scrape);

  loginTimer = setTimeout(() => {
    if (state.phase === "awaiting-login") {
      proc.kill("SIGTERM");
      fail("Login was not completed within 10 minutes; publish cancelled.");
    }
  }, LOGIN_TIMEOUT_MS);

  proc.on("error", (err) => {
    if (loginTimer) clearTimeout(loginTimer);
    loginProc = null;
    if (state.deploymentId === deploymentId) {
      fail(`Could not start defang login: ${err.message} (is the defang CLI in this image?)`);
    }
  });

  proc.on("exit", (code) => {
    if (loginTimer) clearTimeout(loginTimer);
    loginProc = null;
    if (state.phase !== "awaiting-login" || state.deploymentId !== deploymentId) return;
    if (code === 0) {
      void afterLogin(env);
    } else {
      fail(`defang login exited with code ${code}. See log for details.`);
    }
  });

  return state;
}

async function afterLogin(env: NodeJS.ProcessEnv): Promise<void> {
  try {
    const { stdout } = await exec("defang", ["whoami"], { cwd: REPO_DIR, env, timeout: 30_000 });
    state.whoami = stdout.trim().slice(0, 300) || "(unknown identity)";
  } catch (err) {
    fail(`Login succeeded but 'defang whoami' failed: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }
  state.phase = "ready";
  if (state.deploymentId) await setDeploymentStatus(state.deploymentId, "ready");
}

/**
 * Phase 2: the admin's final confirmation. Creates the publish commit (so the
 * uploaded build context's HEAD is the publish marker itself), then runs
 * `defang compose up --detach`. After the CD task launches, this container is
 * typically replaced; the next generation reconciles the row to "live".
 */
export async function confirmDeploy(): Promise<PublishState> {
  if (state.phase !== "ready" || !state.deploymentId || !state.startedBy) return state;
  const deploymentId = state.deploymentId;
  state.phase = "deploying";
  await setDeploymentStatus(deploymentId, "deploying");

  let env: NodeJS.ProcessEnv;
  try {
    env = await publishEnv();
    const sha = await commitPublish(deploymentId, state.startedBy);
    await setDeploymentCommit(deploymentId, sha);
    tail(`[publish] commit ${sha.slice(0, 8)}`);
  } catch (err) {
    fail(`Failed to create the publish commit: ${err instanceof Error ? err.message : String(err)}`);
    return state;
  }

  const stack = process.env.PUBLISH_STACK;
  if (!stack) {
    fail("PUBLISH_STACK is not set by the selected stack env file");
    return state;
  }
  deployProc = spawn("defang", ["compose", "up", "--detach", "--stack", stack], {
    cwd: REPO_DIR,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const proc = deployProc;

  const stream = (chunk: Buffer) => {
    const text = chunk.toString();
    for (const line of text.split("\n")) if (line.trim()) tail(`[up] ${line.trim()}`);
    void appendDeploymentLog(deploymentId, text);
  };
  proc.stdout?.on("data", stream);
  proc.stderr?.on("data", stream);

  proc.on("error", (err) => {
    deployProc = null;
    if (state.deploymentId === deploymentId && state.phase === "deploying") {
      fail(`Could not start defang compose up: ${err.message}`);
    }
  });

  proc.on("exit", (code) => {
    deployProc = null;
    if (state.deploymentId !== deploymentId || state.phase !== "deploying") return;
    if (code === 0) {
      state.phase = "cd-launched";
      void setDeploymentStatus(deploymentId, "cd_launched");
      tail("[publish] CD launched — the deployment continues in the cloud. This environment will restart on the new build.");
    } else {
      fail(`defang compose up exited with code ${code}. See the deployment log.`);
    }
    void cleanupStateDir();
  });

  return state;
}

export async function cancelPublish(): Promise<PublishState> {
  if (!isPublishActive()) return state;
  if (loginTimer) clearTimeout(loginTimer);
  // Flip the phase before killing anything: the child exit handlers guard on
  // it, so this prevents a dying login/deploy process from racing the cancel
  // and marking the deployment failed.
  state = { ...state, phase: "cancelled", error: null };
  loginProc?.kill("SIGTERM");
  deployProc?.kill("SIGTERM");
  loginProc = null;
  deployProc = null;
  if (state.deploymentId) await setDeploymentStatus(state.deploymentId, "cancelled");
  await cleanupStateDir();
  return state;
}
