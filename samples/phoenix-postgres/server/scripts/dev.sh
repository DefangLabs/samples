#!/bin/sh

# Run mix setup
mix setup

# If mix setup succeeds, run mix phx.server
# if [ $? -eq 0 ]; then
mix phx.server
# else
#     echo "mix setup failed, not starting server"
# fi