#!/bin/sh
# Entrypoint for the dev service: coding-agent server + Next.js dev server
# behind Caddy. The two node processes restart automatically if they exit —
# a broken hot reload should degrade, not kill the container.
set -u
cd /workspace

# Baseline git repo so the agent's edits have inspectable history. Done at
# runtime (not build time) so it also works when the source is bind-mounted
# for local development.
if [ ! -d .git ]; then
  git init -q -b main
  git add -A
  git -c user.name="coding-agent" -c user.email="agent@self-updating-mastra.local" \
    commit -qm "baseline: as deployed"
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
