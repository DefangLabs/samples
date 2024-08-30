#!/bin/bash

for dir in ./samples/*/; do
  # set variable pulumi to true if there is a Pulumi.yaml file in the directory, or there is a directory called pulumi
  pulumi=false
  if find "${dir}" -name 'Pulumi.yaml' -exec true {} +; then
    pulumi=true
  elif [[ -d "${dir}pulumi" ]]; then
    pulumi=true
  fi

  if [[ ! -f "${dir}compose.yaml" ]]; then
    if [[ "$pulumi" == "false" ]]; then
      # if not pulumi and no compose, tell user to add compose.yaml
      echo " - [ ] add compose.yaml to ${dir}"
    fi
  else
    # if there is a compose.yaml file, check if it is valid
    if ! defang compose config -C "${dir}" > /dev/null 2>/dev/null; then
      echo " - [ ] ${dir}/compose.yaml contains errors"
    fi
  fi

  # Check that we have a .github/workflows/deploy.yaml file
  if [[ ! -f "${dir}.github/workflows/deploy.yaml" && "$pulumi" == "false" ]]; then
      echo " - [ ] add .github/workflows/deploy.yaml to ${dir} (see starter-sample)"
  fi

  if [[ ! -f "${dir}README.md" ]]; then
    echo " - [ ] add README.md to ${dir}"
  else
    if ! grep -q '^Title:' "${dir}README.md"; then
      echo " - [ ] add 'Title:' to README.md in ${dir}"
    fi
    if ! grep -q '^Short Description:' "${dir}README.md"; then
      echo " - [ ] add 'Short Description:' to README.md in ${dir}"
    fi
    if ! grep -q '^Tags:' "${dir}README.md"; then
      echo " - [ ] add 'Tags:' to README.md in ${dir}"
    fi
    if ! grep -q '^Languages:' "${dir}README.md"; then
      echo " - [ ] add 'Languages:' to README.md in ${dir}"
    fi
  fi

  # Check for #REMOVE_ME_AFTER_EDITING
  matches=$(grep -rnH "#REMOVE_ME_AFTER_EDITING" $dir* | cut -d: -f1,2)

  if [ -n "$matches" ]; then
    echo "$matches" | while read -r line; do
      echo " - [ ] $line contains #REMOVE_ME_AFTER_EDITING... did you forget to edit this section?"
    done
  fi
done
