FROM elixir:1.16-alpine AS builder

RUN apk add --no-cache build-base git

WORKDIR /app

COPY mix.exs ./
RUN mix local.hex --force && mix local.rebar --force
RUN mix deps.get

COPY config config
COPY lib lib
COPY priv priv

ENV MIX_ENV=prod
RUN mix compile
RUN mix release

FROM alpine:3.19
RUN apk add --no-cache libstdc++ openssl ncurses-libs
WORKDIR /app
COPY --from=builder /app/_build/prod/rel/chaos_api ./
ENV DATABASE_HOST=cockroachdb
ENV DATABASE_PORT=26257
ENV NATS_URL=nats://nats:4222
EXPOSE 4000
CMD ["bin/chaos_api", "start"]
