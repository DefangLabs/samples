#!/bin/bash

sample=$1

(
  cd "$sample" || exit

  echo "Starting $sample"
  docker compose up --detach --wait

  echo "Stopping $sample"
  docker down --detach

  echo "Started and Stopped $sample successfully"
)
