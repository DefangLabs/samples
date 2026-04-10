use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::Arc;
use tokio::sync::broadcast;
use warp::ws::{Message, WebSocket};
use warp::Filter;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Event {
    id: String,
    event_type: String,
    payload: serde_json::Value,
    timestamp: String,
}

struct AppState {
    tx: broadcast::Sender<Event>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let nats_url = env::var("NATS_URL").unwrap_or_else(|_| "nats://nats:4222".to_string());
    let kafka_brokers =
        env::var("KAFKA_BROKERS").unwrap_or_else(|_| "redpanda:9092".to_string());

    tracing::info!("Starting WebSocket server");
    tracing::info!("NATS: {}", nats_url);
    tracing::info!("Kafka: {}", kafka_brokers);

    let (tx, _rx) = broadcast::channel::<Event>(1000);
    let state = Arc::new(AppState { tx: tx.clone() });

    // Spawn NATS subscriber
    let nats_tx = tx.clone();
    tokio::spawn(async move {
        loop {
            match nats::connect(&nats_url) {
                Ok(nc) => {
                    tracing::info!("Connected to NATS");
                    if let Ok(sub) = nc.subscribe("events.>") {
                        for msg in sub.messages() {
                            if let Ok(event) = serde_json::from_slice::<Event>(&msg.data) {
                                let _ = nats_tx.send(event);
                            }
                        }
                    }
                }
                Err(e) => {
                    tracing::warn!("NATS connection failed: {}, retrying in 5s", e);
                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
                }
            }
        }
    });

    // Spawn Kafka producer for event archival
    let kafka_tx = tx.clone();
    tokio::spawn(async move {
        use rdkafka::config::ClientConfig;
        use rdkafka::producer::{FutureProducer, FutureRecord};

        let producer: FutureProducer = ClientConfig::new()
            .set("bootstrap.servers", &kafka_brokers)
            .set("message.timeout.ms", "5000")
            .create()
            .expect("Kafka producer creation failed");

        let mut rx = kafka_tx.subscribe();
        while let Ok(event) = rx.recv().await {
            let payload = serde_json::to_string(&event).unwrap();
            let record = FutureRecord::to("events-archive")
                .payload(&payload)
                .key(&event.id);
            if let Err((e, _)) = producer.send(record, tokio::time::Duration::from_secs(5)).await
            {
                tracing::error!("Kafka send failed: {:?}", e);
            }
        }
    });

    let state_filter = warp::any().map(move || state.clone());

    let health = warp::path("health").map(|| {
        warp::reply::json(&serde_json::json!({"status": "ok", "service": "rust-ws"}))
    });

    let ws_route = warp::path("ws")
        .and(warp::ws())
        .and(state_filter)
        .map(|ws: warp::ws::Ws, state: Arc<AppState>| {
            ws.on_upgrade(move |socket| handle_ws(socket, state))
        });

    let routes = health.or(ws_route);

    tracing::info!("Listening on 0.0.0.0:9090");
    warp::serve(routes).run(([0, 0, 0, 0], 9090)).await;
}

async fn handle_ws(ws: WebSocket, state: Arc<AppState>) {
    let (mut ws_tx, mut ws_rx) = ws.split();
    let mut rx = state.tx.subscribe();

    // Forward broadcast events to WebSocket
    let send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            let msg = serde_json::to_string(&event).unwrap();
            if ws_tx.send(Message::text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming WebSocket messages
    while let Some(Ok(msg)) = ws_rx.next().await {
        if msg.is_text() {
            if let Ok(event) = serde_json::from_str::<Event>(msg.to_str().unwrap_or("")) {
                let _ = state.tx.send(event);
            }
        }
    }

    send_task.abort();
}
