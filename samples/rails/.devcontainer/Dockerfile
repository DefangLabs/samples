ARG RUBY_VERSION=3.3.4
FROM ghcr.io/rails/devcontainer/images/ruby:$RUBY_VERSION

RUN apt-get update -qq \
      && apt-get install -y postgresql-client libpq-dev \
      && apt-get clean \
      && rm -rf /var/lib/apt/lists/*
