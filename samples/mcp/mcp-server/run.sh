#!/usr/bin/env bash

echo "Starting MCP Server"

# may need to add this
# mcp-server-time &

# Run og entrypoint "mcp-server-time" in the background
echo "Waiting for MCP Server to start"

# activate the venv
source venv/bin/activate

# run python main.py using the venv
python3 main.py
