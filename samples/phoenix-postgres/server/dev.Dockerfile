# ---- Development Stage ----
FROM elixir:1.16-alpine

# Install build dependencies
RUN apk add --no-cache build-base npm git python3 inotify-tools

# Prepare build dir
WORKDIR /app

# Install hex + rebar
RUN mix local.hex --force && \
    mix local.rebar --force

# Set build ENV
ENV MIX_ENV=dev

CMD [ "./scripts/dev.sh" ]