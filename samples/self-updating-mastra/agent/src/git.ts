import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AGENT_REPO, LIVE_REPO } from "./paths.js";

const exec = promisify(execFile);

/**
 * Git operations for the sample's in-container repository. There are two working
 * trees on the same repo (see paths.ts):
 *
 *  - LIVE_REPO  — the served tree (dev server + admin history), branch `main`.
 *  - AGENT_REPO — the coding agent's isolated worktree, checked out detached.
 *
 * A run edits AGENT_REPO, typechecks it, then `applyToLive` fast-forwards the
 * commit into LIVE_REPO, so the dev server only ever sees a single atomic,
 * already-typechecked update. Both trees are initialized by entrypoint.dev.sh
 * on first boot and carried across self-redeploys inside the dev image. The
 * coding agent has no access to any of this — these helpers run only in this
 * server, on behalf of the run lifecycle and the admin console.
 *
 * Safety rule: every mutating operation is scoped to todo-app/ (the only tree
 * the agent edits). In local development the repo may be a bind mount of a real
 * working tree, so nothing here may ever reset or clean the whole repository.
 */
export const REPO_DIR = LIVE_REPO;

const AGENT_IDENTITY = ["-c", "user.name=coding-agent", "-c", "user.email=agent@self-updating-mastra.local"];

async function git(
  args: string[],
  opts: { identity?: string[]; cwd?: string } = {},
): Promise<string> {
  const { stdout } = await exec("git", [...(opts.identity ?? AGENT_IDENTITY), ...args], {
    cwd: opts.cwd ?? LIVE_REPO,
    timeout: 30_000,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}

/** Same as git(), but scoped to the coding agent's isolated worktree. */
function agentGit(args: string[]): Promise<string> {
  return git(args, { cwd: AGENT_REPO });
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
 * Reset the agent worktree to the live tree's current HEAD before a run, so the
 * agent starts from exactly what users see now (including any admin reverts or
 * publishes since the last run). Scoped clean of todo-app/ only — see the safety
 * rule above; node_modules is gitignored so the symlinked install is preserved.
 */
export async function syncAgentWorktree(): Promise<void> {
  const head = await headSha();
  if (!head) return;
  await agentGit(["reset", "-q", "--hard", head]);
  await agentGit(["clean", "-qfd", "--", "todo-app"]);
}

/**
 * Commit the agent's edits (in its worktree) for a successful run. The message
 * carries git trailers pointing at the Postgres rows this commit addressed, so
 * history and the database cross-reference each other. Returns the commit sha,
 * or null when the run produced no file changes. Does NOT touch the live tree —
 * call applyToLive(sha) to publish it to users.
 */
export async function commitRun(args: {
  runId: string;
  feedbackIds: string[];
  model: string;
  summary: string;
}): Promise<string | null> {
  await agentGit(["add", "-A", "--", "todo-app"]);
  try {
    await agentGit(["diff", "--cached", "--quiet"]);
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
  await agentGit(["commit", "-q", "-m", message]);
  return (await agentGit(["rev-parse", "HEAD"])).trim();
}

/**
 * Publish a commit made in the agent worktree to the live, served tree. Because
 * the worktree was synced to live HEAD before the run, the commit is a direct
 * descendant, so this is a pure fast-forward: the dev server sees one atomic
 * update to already-typechecked files instead of every intermediate edit.
 */
export async function applyToLive(sha: string): Promise<void> {
  await git(["merge", "--ff-only", "-q", sha]);
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
  await git(["add", "-A"], { identity });
  const message = `publish: deployment ${deploymentId.slice(0, 8)} by ${adminEmail}\n\nDeployment-Id: ${deploymentId}`;
  await git(["commit", "-q", "--allow-empty", "-m", message], { identity });
  return (await git(["rev-parse", "HEAD"])).trim();
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
  restorable: boolean;
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
      restorable: false, // likewise
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
 * Revert a run commit as a new commit authored by the admin, directly on the
 * live tree (an admin action, applied immediately — the dev server hot-reloads
 * the restored files). Refuses commits that touch anything outside todo-app/
 * (baseline and publish markers). On conflict the revert is aborted and the
 * tree left untouched.
 */
export async function revertCommit(sha: string, adminEmail: string): Promise<string> {
  if (!(await isRevertable(sha))) {
    throw new Error("only commits scoped to todo-app can be undone");
  }
  const identity = ["-c", `user.name=${adminEmail}`, "-c", `user.email=${adminEmail}`];
  try {
    await git(["revert", "--no-edit", sha], { identity });
  } catch (err) {
    await git(["revert", "--abort"]).catch(() => {});
    const e = err as { stderr?: string; message?: string };
    throw new Error(`revert failed: ${(e.stderr || e.message || "unknown error").slice(0, 500)}`);
  }
  return (await git(["rev-parse", "HEAD"])).trim();
}

/**
 * Restore todo-app/ to its exact state at `sha`, as a new commit authored by
 * the admin — "reset back to this point in time" without rewriting history.
 * Unlike revertCommit (which unpicks one commit's diff and keeps everything
 * after it), this removes the effect of every commit after `sha`. Scoped to
 * todo-app/ (see the safety rule above), which is what makes any history entry
 * a valid target, including baseline and publish markers. Returns the new
 * commit sha, or null when the live tree already matches that state.
 */
export async function restoreToCommit(sha: string, adminEmail: string): Promise<string | null> {
  const target = (await git(["rev-parse", "--verify", `${sha}^{commit}`])).trim();
  const appTree = (await git(["ls-tree", "-d", target, "--", "todo-app"])).trim();
  if (!appTree) throw new Error("that commit has no todo-app tree to restore");
  const identity = ["-c", `user.name=${adminEmail}`, "-c", `user.email=${adminEmail}`];
  try {
    // rm + checkout (rather than checkout alone) so files added after `target`
    // are deleted too; the checkout rematerializes index and worktree at it.
    await git(["rm", "-rq", "--ignore-unmatch", "--", "todo-app"], { identity });
    await git(["checkout", target, "--", "todo-app"], { identity });
  } catch (err) {
    // Put the live tree back to HEAD before surfacing the error.
    await git(["reset", "-q", "HEAD", "--", "todo-app"]).catch(() => {});
    await git(["checkout", "-q", "HEAD", "--", "todo-app"]).catch(() => {});
    await git(["clean", "-qfd", "--", "todo-app"]).catch(() => {});
    const e = err as { stderr?: string; message?: string };
    throw new Error(`restore failed: ${(e.stderr || e.message || "unknown error").slice(0, 500)}`);
  }
  try {
    await git(["diff", "--cached", "--quiet"]);
    return null; // already in this state
  } catch {
    // non-zero exit: there are staged changes to commit
  }
  const message = `restore: todo-app back to ${target.slice(0, 8)}\n\nRestore-To: ${target}`;
  await git(["commit", "-q", "-m", message], { identity });
  return (await git(["rev-parse", "HEAD"])).trim();
}
