#!/bin/bash

nohup ollama serve >ollama.log 2>&1 &
time curl --retry 5 --retry-connrefused --retry-delay 0 -sf http://localhost:8000

echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"
echo "@ Loading model $LOAD_MODEL @"
echo "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@"

# if $LOAD_MODEL is not set, crash the container
if [ -z "$LOAD_MODEL" ]; then
    echo "LOAD_MODEL is not set. Exiting..."
    exit 1
fi

ollama pull "$LOAD_MODEL"

tail -f ollama.log
