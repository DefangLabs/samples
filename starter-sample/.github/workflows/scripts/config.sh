#!/bin/bash

output=$(defang compose config)

if [ -n "$BASH" ]; then
    sources=$(echo "$output" | grep 'source:' | awk '{print $3}')
    for source in $sources; do
        if [ -z "${!source}" ]; then
            echo "No value found for $source in environment."
        else
            echo "Setting $source"
            defang config set -T "$source=${!source}"
        fi
    done
elif [ -n "$ZSH_VERSION" ]; then
    sources=($(echo "$output" | grep 'source:' | awk '{print $3}'))
    for source in $sources; do
        if [ -z "${(P)source}" ]; then
            echo "No value found for $source in environment."
        else
            echo "Setting $source"
            defang config set -T "$source=${(P)source}"
        fi
    done
fi
