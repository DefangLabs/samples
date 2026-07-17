import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { TARGET_DIR } from "./coder.js";

const exec = promisify(execFile);

/**
 * Git operations for the sample's in-container repository. The repo root is
 * the sample directory (the parent of todo-app/), initialized by
 * entrypoint.dev.sh on first boot and carried across self-redeploys inside
 * the dev image. The coding agent has no access to any of this — these
 * helpers run only in this server, on behalf of the run lifecycle and the
 * admin console.
 *
 * Safety rule: every mutating operation is scoped to todo-app/ (the only
 * tree the agent edits). In local development the repo may be a bind mount
 * of a real working tree, so nothing here may ever reset or clean the whole
 * repository.
 */
export const REPO_DIR = path.resolve(TARGET_DIR, "..");

const AGENT_IDENTITY = ["-c", "user.name=coding-agent", "-c", "user.email=agent@self-updating-mastra.local"];

async function git(args: string[], identity: string[] = AGENT_IDENTITY): Promise<string> {
  const { stdout } = await exec("git", [...identity, ...args], {
    cwd: REPO_DIR,
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

export async function headSha(): Promise<string | null> {
  try {
    return (await git(["rev-parse", "HEAD"])).trim();
  } catch {
    return null; // not a git repo (e.g. bare local checkout without entrypoint)
  }
}

function subjectFrom(summary: string): string {
  const first = summary.split("\n").find((line) => line.trim()) ?? "";
  const cleaned = first.trim().replace(/^#+\s*/, "");
  const subject = cleaned || "apply change request";
  return subject.length > 72 ? `${subject.slice(0, 69)}...` : subject;
}

/**
 * Commit the agent's edits for a successful run. The message carries git
 * trailers pointing at the Postgres rows this commit addressed, so history
 * and the database cross-reference each other. Returns the commit sha, or
 * null when the run produced no file changes.
 */
export async function commitRun(args: {
  runId: string;
  feedbackIds: string[];
  model: string;
  summary: string;
}): Promise<string | null> {
  await git(["add", "-A", "--", "todo-app"]);
  try {
    await git(["diff", "--cached", "--quiet"]);
    return null; // nothing staged
  } catch {
    // non-zero exit: there are staged changes to commit
  }
  const trailers = [
    `Run-Id: ${args.runId}`,
    ...args.feedbackIds.map((id) => `Feedback-Id: ${id}`),
    `Model: ${args.model}`,
  ].join("\n");
  const message = `agent: ${subjectFrom(args.summary)}\n\n${trailers}`;
  await git(["commit", "-q", "-m", message]);
  return (await git(["rev-parse", "HEAD"])).trim();
}

/**
 * Publish marker commit, authored by the admin who triggered the deployment.
 * Sweeps any stray uncommitted files first (belt and braces — runs commit or
 * revert their own changes), then records the publish even when the tree is
 * clean, so the uploaded build context's HEAD is the publish itself and the
 * next container generation can recognize the deployment it came from.
 */
export async function commitPublish(deploymentId: string, adminEmail: string): Promise<string> {
  const identity = ["-c", `user.name=${adminEmail}`, "-c", `user.email=${adminEmail}`];
  await git(["add", "-A"], identity);
  const message = `publish: deployment ${deploymentId.slice(0, 8)} by ${adminEmail}\n\nDeployment-Id: ${deploymentId}`;
  await git(["commit", "-q", "--allow-empty", "-m", message], identity);
  return (await git(["rev-parse", "HEAD"])).trim();
}

/**
 * Discard the working tree back to the last good commit after a failed run.
 * Deliberately scoped to todo-app/ — see the safety rule above.
 */
export async function revertWorkingTree(): Promise<void> {
  await git(["reset", "-q", "--", "todo-app"]);
  await git(["checkout", "-q", "--", "todo-app"]);
  await git(["clean", "-qfd", "--", "todo-app"]);
}

export interface HistoryEntry {
  sha: string;
  author: string;
  date: string;
  subject: string;
  runId: string | null;
  feedbackIds: string[];
  deploymentId: string | null;
  revertable: boolean;
}

const FIELD_SEP = "\x1f";
const ENTRY_SEP = "\x1e";

export async function history(limit = 50): Promise<HistoryEntry[]> {
  const format = [
    "%H",
    "%an",
    "%aI",
    "%s",
    "%(trailers:key=Run-Id,valueonly,separator=%x2c)",
    "%(trailers:key=Feedback-Id,valueonly,separator=%x2c)",
    "%(trailers:key=Deployment-Id,valueonly,separator=%x2c)",
  ].join(FIELD_SEP);
  let raw: string;
  try {
    raw = await git(["log", "-n", String(limit), `--format=${format}${ENTRY_SEP}`]);
  } catch {
    return []; // no repo or no commits yet
  }
  const entries: HistoryEntry[] = [];
  for (const chunk of raw.split(ENTRY_SEP)) {
    const line = chunk.replace(/^\n/, "");
    if (!line.trim()) continue;
    const [sha, author, date, subject, runId, feedbackIds, deploymentId] = line.split(FIELD_SEP);
    if (!sha) continue;
    entries.push({
      sha,
      author: author ?? "",
      date: date ?? "",
      subject: subject ?? "",
      runId: runId?.trim() ? runId.trim() : null,
      feedbackIds: feedbackIds?.trim() ? feedbackIds.split(",").map((s) => s.trim()) : [],
      deploymentId: deploymentId?.trim() ? deploymentId.trim() : null,
      revertable: false, // filled in by the caller for the entries it exposes
    });
  }
  return entries;
}

/** Paths touched by a commit, relative to the repo root. */
export async function commitPaths(sha: string): Promise<string[]> {
  const out = await git(["diff-tree", "--no-commit-id", "--name-only", "-r", sha]);
  return out.split("\n").filter(Boolean);
}

/** A commit is revertable from the console iff it only touches todo-app/. */
export async function isRevertable(sha: string): Promise<boolean> {
  try {
    const paths = await commitPaths(sha);
    return paths.length > 0 && paths.every((p) => p.startsWith("todo-app/"));
  } catch {
    return false;
  }
}

/**
 * Revert a run commit as a new commit authored by the admin. Refuses commits
 * that touch anything outside todo-app/ (baseline and publish markers).
 * On conflict the revert is aborted and the tree left untouched.
 */
export async function revertCommit(sha: string, adminEmail: string): Promise<string> {
  if (!(await isRevertable(sha))) {
    throw new Error("only agent commits scoped to todo-app can be reverted");
  }
  const identity = ["-c", `user.name=${adminEmail}`, "-c", `user.email=${adminEmail}`];
  try {
    await git(["revert", "--no-edit", sha], identity);
  } catch (err) {
    await git(["revert", "--abort"]).catch(() => {});
    const e = err as { stderr?: string; message?: string };
    throw new Error(`revert failed: ${(e.stderr || e.message || "unknown error").slice(0, 500)}`);
  }
  return (await git(["rev-parse", "HEAD"])).trim();
}
