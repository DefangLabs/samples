#!/bin/bash
set -euo pipefail

git diff --name-only HEAD main \
  | grep '^samples/' \
  | awk -F'/' '{print $1"/"$2}' \
  | sort \
  | uniq
