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
