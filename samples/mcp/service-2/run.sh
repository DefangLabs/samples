#!/bin/bash

echo "Starting MCP Service"

# activate the venv
source /wrapper/venv/bin/activate

# run python main.py using the venv
python3 main.py
