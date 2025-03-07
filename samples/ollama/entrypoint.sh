#!/bin/bash

set -eo pipefail

# Start Ollama in the background.
ollama serve &
# Record Process ID.
pid=$!

# if $MODEL is not set, crash the container
if [ -z "$MODEL" ]; then
    echo "No $MODEL is set. Exiting..."
    exit 1
fi

echo "Retrieving model $MODEL"
for i in {1..5}; do
    if ollama pull $MODEL; then
        break
    else
        echo "Attempt $i to retrieve model $MODEL failed. Retrying..."
        sleep 2
    fi
done

if [ $i -eq 5 ]; then
    echo "Failed to retrieve model $MODEL after 5 attempts. Exiting..."
    exit 1
fi
echo "Done!"

# Wait for Ollama process to finish.
wait $pid