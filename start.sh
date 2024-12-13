#!/bin/bash

mkdir -p /usr/local/lib/ollama
mkdir -p /app/.ollama/models
mkdir -p /etc/ollama

export OLLAMA_HOST=0.0.0.0:11434
export OLLAMA_MODELS=/app/.ollama/models
export OLLAMA_ORIGINS="*"
export OLLAMA_VERBOSE=1
export OLLAMA_KEEP_ALIVE=-1
ollama serve &

if ! ollama list | grep -q "callmeserein/unisast:latest"; then
    echo "Model not found locally. Pulling callmeserein/unisast..."
    ollama pull callmeserein/unisast
else
    echo "Model already exists locally. Skipping pull."
fi

python src/main.py &
ollama run callmeserein/unisast ""

PYTHON_PID=$!

wait -n $PYTHON_PID
EXIT_CODE=$?

kill $PYTHON_PID 2>/dev/null

exit $EXIT_CODE