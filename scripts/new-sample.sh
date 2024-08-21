#!/bin/bash

while true; do
  # prompt for a directory name for the sample (should be kebab-case)
  printf "Enter the name of the sample (kebab-case): "
  read -r sample_name

  # make sure it's actually kebab-case
  if [[ ! "$sample_name" =~ ^[a-z0-9-]+$ ]]; then
    echo "Sample name must be kebab-case"
    continue
  fi

  # check if dir exists in the samples directory
  if [ -d "samples/$sample_name" ]; then
    echo "Sample already exists"
    continue
  fi

  # if we reach here, the name is valid and the directory does not exist
  break
done

# copy starter-sample to new sample directory
cp -r starter-sample "samples/$sample_name"

# party time
echo "Sample created at samples/$sample_name"
