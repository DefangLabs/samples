#!/bin/bash

sample=$1

(
  cd "$sample" || exit

  echo "Deploying $sample"
  defang compose up

  echo "Deprovisioning $sample"
  defang compose down --detach

  echo "Deployed and deprovisioned $sample successfully"
)
