#!/bin/sh
# Entrypoint for the dev service: coding-agent server + Next.js dev server
# behind Caddy. The two node processes restart automatically if they exit —
# a broken hot reload should degrade, not kill the container.
set -u
cd /workspace

# Git repo backing the run/publish history shown in the admin console. On the
# very first deploy there is no .git in the build context, so a baseline repo
# is created here. On every publish after that, the workspace (including
# .git) IS the build context, so the accumulated history — one commit per
# successful agent run, one per publish — survives self-redeploys. Done at
# runtime (not build time) so it also works when the source is bind-mounted
# for local development.
if [ ! -d .git ]; then
  git init -q -b main
  git add -A
  git -c user.name="coding-agent" -c user.email="agent@self-updating-mastra.local" \
    commit -qm "baseline: as deployed"
else
  echo "existing git history: $(git rev-list --count HEAD 2>/dev/null || echo 0) commit(s) at $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
fi

# Isolated worktree for the coding agent. It edits and typechecks here; a
# successful run is fast-forwarded into this live tree (see agent/src/git.ts),
# so the Next.js dev server — which watches /workspace/todo-app — never serves a
# half-applied edit. Kept outside /workspace so it stays out of the served tree
# and the publish build context. `prune` first drops the stale registration that
# rides along in .git across a self-redeploy (its directory won't exist in the
# fresh container).
AGENT_WT="${AGENT_WORKTREE_DIR:-/agent-worktree}"
git worktree prune
if [ ! -e "$AGENT_WT/.git" ]; then
  rm -rf "$AGENT_WT"
  git worktree add -q --detach "$AGENT_WT" HEAD
fi
# tsc in the worktree needs the app's dependencies; share the image's install
# rather than duplicating it (node_modules is gitignored, so it never commits).
if [ ! -e "$AGENT_WT/todo-app/node_modules" ]; then
  ln -s /workspace/todo-app/node_modules "$AGENT_WT/todo-app/node_modules"
fi

(
  cd agent
  while true; do
    npm start
    echo "agent server exited; restarting in 2s" >&2
    sleep 2
  done
) &

(
  cd todo-app
  while true; do
    npm run dev -- --port 3001
    echo "next dev exited; restarting in 2s" >&2
    sleep 2
  done
) &

exec caddy run --config /workspace/Caddyfile --adapter caddyfile
