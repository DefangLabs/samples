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
done
