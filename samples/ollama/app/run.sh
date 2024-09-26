#!/bin/bash

nohup ollama serve > ollama.log 2>&1 &
time curl --retry 5 --retry-connrefused --retry-delay 0 -sf http://localhost:8000

ollama pull llama3.2:1b

# tail the log file infinitely
tail -f ollama.log