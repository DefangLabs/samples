#!/bin/bash

set -e

sample=$1

(
  cd "$sample"

  echo "Starting $sample"
  docker compose up --detach --wait

  echo "Stopping $sample"
  docker down --detach

  echo "Started and Stopped $sample successfully"
)
