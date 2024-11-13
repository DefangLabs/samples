#!/bin/bash

set -eo pipefail

# assert that a TENANT environment variable is set
if [ -z "$TENANT" ]; then
  echo "TENANT environment variable must be set"
  exit 1
fi

# assert that a CLUSTER environment variable is set
if [ -z "$CLUSTER" ]; then
  echo "CLUSTER environment variable must be set"
  exit 1
fi

export XDG_STATE_HOME=/tmp/state/
export DEFANG_FABRIC=$CLUSTER:443

go run -C defang-mvp/tools/testing cmd/issuetoken/main.go -t "$TENANT" > "$XDG_STATE_HOME/$CLUSTER"

# this suffers from TOCTOU, but we don't have a way to deprovision a project
# unless we know its name first
RUNNING_PROJECT=$(defang ls | grep -v '^ \* ' | head -n1 | awk '{print $2}')
if [ -n "$RUNNING_PROJECT" ]; then
  echo "Deprovisioning previously running project..."
  if ! defang down --detach --project-name="$RUNNING_PROJECT"; then
    echo "Failed to deprovision $RUNNING_PROJECT. Continuing..."
  fi
fi

defang whoami

export -f bash

echo "Deploying samples: $*"

parallel --tagstring "[{#}] " bash ./scripts/deploy-sample.sh ::: "$@"
