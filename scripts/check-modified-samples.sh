#!/bin/bash

# This script checks which samples have been created or modified since the last commit and prints a list of them.

for dir in samples/*/; do
    # Use git diff to check if the directory has been created or modified between the last commit and the commit before it
    if git diff --name-only --diff-filter=d HEAD~1..HEAD | grep -q "^${dir}"; then
        # If it has, print the name of the directory
        echo "$dir"
    fi
done

