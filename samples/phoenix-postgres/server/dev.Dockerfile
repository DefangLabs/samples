# ---- Development Stage ----
FROM hexpm/elixir:1.16.2-erlang-24.0.6-debian-buster-20240513-slim

# Install build dependencies
RUN apt-get update -y && apt-get install -y build-essential git inotify-tools

# Prepare build dir
WORKDIR /app

# Install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set build ENV
ENV MIX_ENV=dev

CMD [ "./scripts/dev.sh" ]