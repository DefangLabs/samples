FROM mcr.microsoft.com/devcontainers/java:11-bookworm

# Install Maven
RUN apt-get update \
    && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends maven \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*
