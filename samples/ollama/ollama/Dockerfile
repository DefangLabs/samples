FROM debian:bookworm-slim

# install curl
RUN apt-get update && apt-get install -y curl && apt-get clean

# Define build-time arguments with default values
ARG OLLAMA_HOST=0.0.0.0:8000
ARG OLLAMA_MODELS=/usr/share/ollama/.ollama/models

# Use the build-time arguments to set environment variables
ENV OLLAMA_HOST=${OLLAMA_HOST}
ENV OLLAMA_MODELS=${OLLAMA_MODELS}
ENV LOAD_MODEL=llama3.2:1b

RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app

COPY ./run.sh ./run.sh

CMD ["./run.sh"]