FROM rust:1.77-bookworm AS builder

RUN apt-get update && apt-get install -y cmake librdkafka-dev pkg-config && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY Cargo.toml Cargo.toml
COPY src src

RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y librdkafka1 ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /app/target/release/chaos-ws .

ENV NATS_URL=nats://nats:4222
ENV KAFKA_BROKERS=redpanda:9092
EXPOSE 9090
CMD ["./chaos-ws"]
