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
    (
      cd $dir
      output=$(defang compose config 2>&1)
      if [[ $? -ne 0 ]]; then
        echo " - [ ] ${dir}compose.yaml is not valid according to \`defang compose config\`:  $output"
      fi
    )

    # Ensure the name: in Compose matches the sample/folder name
    sample_name=$(basename "$dir")
    compose_name=$(grep -E '^name:' "${dir}compose.yaml" | awk '{print $2}')
    if [[ "$sample_name" != "$compose_name" ]]; then
      echo " - [ ] fix name: in ${dir}compose.yaml to be '$sample_name' (currently '$compose_name')"
    fi
  fi

  # Check that we NOT have a .github/workflows/deploy.yaml file; it's generated from templates/deploy.yaml
  if [[ -f "${dir}.github/workflows/deploy.yaml" && "$pulumi" == "false" ]]; then
      echo " - [ ] remove .github/workflows/deploy.yaml to ${dir} (generated file)"
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
  matches=$(grep -rnH "#REMOVE_ME_AFTER_EDITING" "$dir" | cut -d: -f1,2)

  if [ -n "$matches" ]; then
    echo "$matches" | while read -r line; do
      echo " - [ ] $line contains #REMOVE_ME_AFTER_EDITING... did you forget to edit this section?"
    done
  fi
done
