FROM elixir:latest

# Install dependencies
RUN apt-get update && \
    apt-get install -y inotify-tools postgresql-client npm

# Install Hex + Rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Install Phoenix
RUN mix archive.install hex phx_new --force

# Set up working directory
WORKDIR /workspace

# Install Node.js for assets (optional)
RUN npm install -g npm

# Expose Phoenix port
EXPOSE 4000