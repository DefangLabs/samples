FROM haskell:9.6-slim AS builder

WORKDIR /app
COPY stack.yaml package.yaml ./
RUN stack setup --install-ghc
RUN stack build --only-dependencies

COPY app app
COPY src src
RUN stack build --copy-bins

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates libgmp10 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /root/.local/bin/chaos-worker .

ENV SCYLLA_HOST=scylladb
ENV SCYLLA_PORT=9042
ENV NATS_URL=nats://nats:4222
ENV POLL_INTERVAL=10
CMD ["./chaos-worker"]
