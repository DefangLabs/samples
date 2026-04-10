# ChaosMesh - Multi-Service Stress Test

A deliberately weird multi-service application for testing Docker Compose generators.

## Architecture

```
                    ┌──────────────┐
                    │   Caddy      │ :2080 (reverse proxy)
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼─────┐ ┌───▼────┐ ┌────▼─────┐
       │ Elixir API │ │Rust WS │ │ Haskell  │
       │  (Phoenix) │ │ Server │ │ Cron Job │
       │   :4000    │ │ :9090  │ │ (worker) │
       └──────┬─────┘ └───┬────┘ └────┬─────┘
              │            │           │
       ┌──────▼─────┐ ┌───▼────┐ ┌────▼──────┐
       │CockroachDB │ │  NATS  │ │ ScyllaDB  │
       │  :26257    │ │ :4222  │ │   :9042   │
       └────────────┘ └────────┘ └───────────┘
                           │
                      ┌────▼─────┐
                      │ Redpanda │
                      │  :9092   │
                      └──────────┘
```

## Services

- **Elixir Phoenix API** - REST API with CockroachDB backend
- **Rust WebSocket Server** - Real-time event streaming via NATS
- **Haskell Worker** - Periodic job processor using ScyllaDB for state
- **CockroachDB** - Distributed SQL database (PostgreSQL wire protocol)
- **NATS** - Message broker for inter-service communication
- **ScyllaDB** - Wide-column store (Cassandra compatible)
- **Redpanda** - Kafka-compatible event streaming
- **Caddy** - Reverse proxy with automatic HTTPS

## Running

```bash
docker compose up --build
```

The API is available at http://localhost:2080/api
WebSocket endpoint at ws://localhost:2080/ws
