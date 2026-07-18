import path from "node:path";

// Filesystem layout for the two working trees this server juggles.
//
// The coding agent must not edit the files the Next.js dev server is actively
// serving: a run writes many files one at a time, and hot-reloading each
// intermediate (half-applied, not-yet-compiling) state in front of real users
// is exactly the flood of transient errors we want to avoid. So the agent edits
// an ISOLATED git worktree, typechecks it there, and the result is
// fast-forwarded into the live tree only once it succeeds — the dev server sees
// a single atomic, already-typechecked update.

/**
 * The live, served working tree. The Next.js dev server runs here, and the
 * admin console's git history (one commit per successful run, one per publish)
 * lives in its `.git`. Checked out on branch `main`.
 */
export const LIVE_REPO = path.resolve(
  process.env.LIVE_REPO_DIR ?? path.join(import.meta.dirname, "../.."),
);
export const LIVE_TODO = path.join(LIVE_REPO, "todo-app");

/**
 * The coding agent's isolated worktree of the same repository. It edits and
 * typechecks here; `applyToLive` fast-forwards the result into LIVE_REPO.
 * Created (and node_modules-linked) by entrypoint.dev.sh, and kept OUTSIDE
 * LIVE_REPO so it never enters the served file tree or the publish build
 * context.
 */
export const AGENT_REPO = path.resolve(
  process.env.AGENT_WORKTREE_DIR ?? path.join(LIVE_REPO, "..", "agent-worktree"),
);
export const AGENT_TODO = path.join(AGENT_REPO, "todo-app");
