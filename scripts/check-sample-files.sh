#!/bin/bash

for dir in ./samples/*/; do
  if [[ ! -f "${dir}compose.yaml" ]]; then
    if find "${dir}" -name 'Pulumi.yaml' -exec false {} +; then
      echo " - [ ] add compose.yaml to ${dir}"
    fi
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
