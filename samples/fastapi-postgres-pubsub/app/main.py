"""Simplest possible FastAPI chat demo using PostgreSQL LISTEN/NOTIFY.

The goal of this file is to show the basic flow end to end:

1. A user submits a chat message with ``POST /messages``.
2. The API stores the message in PostgreSQL and issues ``pg_notify``.
3. Every running API instance listens for that notification and forwards it
   to connected WebSocket clients.
4. The browser keeps a WebSocket open so it can display new messages instantly.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import asyncpg
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

logger = logging.getLogger("chat")
logging.basicConfig(level=logging.INFO)

CHAT_CHANNEL = "chat_messages"
MIGRATION_LOCK_ID = 101
TEMPLATE_PATH = Path(__file__).resolve().parent / "templates" / "index.html"


class MessageCreate(BaseModel):
    """Request body for ``POST /messages``."""

    message: str = Field(..., min_length=1, max_length=500)


class WebSocketRegistry:
    """Keeps track of the browsers that are connected via WebSocket."""

    def __init__(self) -> None:
        self._sockets: set[WebSocket] = set()
        self._lock = asyncio.Lock()

    async def add(self, socket: WebSocket) -> None:
        async with self._lock:
            self._sockets.add(socket)

    async def remove(self, socket: WebSocket) -> None:
        async with self._lock:
            self._sockets.discard(socket)

    async def broadcast(self, payload: dict[str, Any]) -> None:
        async with self._lock:
            sockets = list(self._sockets)
        for socket in sockets:
            try:
                await socket.send_json(payload)
            except Exception:
                await self.remove(socket)


def build_database_dsn() -> str:
    """Build a PostgreSQL connection string from environment variables."""

    url = os.getenv("DATABASE_URL")
    if url:
        return url
    raise ValueError("DATABASE_URL environment variable is not set")

async def create_tables(pool: asyncpg.Pool) -> None:
    """Make sure the ``messages`` table exists."""

    async with pool.acquire() as conn:
        await conn.execute("SELECT pg_advisory_lock($1)", MIGRATION_LOCK_ID)
        try:
            await conn.execute(
                """
                CREATE TABLE IF NOT EXISTS messages (
                    id BIGSERIAL PRIMARY KEY,
                    message TEXT NOT NULL,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
        finally:
            await conn.execute("SELECT pg_advisory_unlock($1)", MIGRATION_LOCK_ID)


async def fetch_recent_messages(pool: asyncpg.Pool, limit: int = 50) -> list[dict[str, Any]]:
    """Return the most recent chat messages."""

    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, message, created_at
            FROM messages
            ORDER BY created_at ASC
            LIMIT $1
            """,
            limit,
        )
    return [
        {
            "id": row["id"],
            "message": row["message"],
            "created_at": row["created_at"].isoformat(),
        }
        for row in rows
    ]


async def save_message(pool: asyncpg.Pool, text: str) -> dict[str, Any]:
    """Insert a message and notify other app instances about it."""

    message = text.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message must not be empty")

    async with pool.acquire() as conn:
        async with conn.transaction():
            record = await conn.fetchrow(
                """
                INSERT INTO messages (message)
                VALUES ($1)
                RETURNING id, message, created_at
                """,
                message,
            )
            body = {
                "type": "message",
                "data": {
                    "id": record["id"],
                    "message": record["message"],
                    "created_at": record["created_at"].isoformat(),
                },
            }
            await conn.execute("SELECT pg_notify($1, $2)", CHAT_CHANNEL, json.dumps(body))
    return body["data"]


async def forward_notification(payload: str) -> None:
    """Handle the JSON payload coming from PostgreSQL."""

    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        logger.warning("Ignoring unexpected payload: %s", payload)
        return
    await app.state.connections.broadcast(data)


async def notification_listener(stop_event: asyncio.Event) -> None:
    """Listen for ``pg_notify`` events until the app shuts down."""

    loop = asyncio.get_running_loop()
    database_dsn = build_database_dsn()
    conn = await asyncpg.connect(dsn=database_dsn)

    def _listener(_connection: asyncpg.Connection, _pid: int, _channel: str, payload: str) -> None:
        loop.create_task(forward_notification(payload))

    await conn.add_listener(CHAT_CHANNEL, _listener)
    try:
        await stop_event.wait()
    finally:
        await conn.remove_listener(CHAT_CHANNEL, _listener)
        await conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events."""
    # Startup
    database_dsn = build_database_dsn()
    pool = await asyncpg.create_pool(dsn=database_dsn, min_size=1, max_size=5)
    app.state.db_pool = pool
    await create_tables(pool)

    stop_event = asyncio.Event()
    app.state.listener_stop = stop_event
    app.state.listener_task = asyncio.create_task(notification_listener(stop_event))
    
    yield
    
    # Shutdown
    stop_event = app.state.listener_stop
    if stop_event:
        stop_event.set()
    listener_task = app.state.listener_task
    if listener_task:
        await listener_task

    pool = app.state.db_pool
    if pool:
        await pool.close()


app = FastAPI(title="FastAPI Postgres Pub/Sub Chat", lifespan=lifespan)
app.state.connections = WebSocketRegistry()
app.state.listener_stop: asyncio.Event | None = None
app.state.listener_task: asyncio.Task | None = None
app.state.db_pool: asyncpg.Pool | None = None


def get_pool() -> asyncpg.Pool:
    pool = app.state.db_pool
    if pool is None:
        raise HTTPException(status_code=500, detail="Database connection not ready")
    return pool




@app.get("/", response_class=HTMLResponse)
async def index() -> HTMLResponse:
    if not TEMPLATE_PATH.exists():
        raise HTTPException(status_code=500, detail="Template not found")
    return HTMLResponse(TEMPLATE_PATH.read_text(encoding="utf-8"))


@app.post("/messages")
async def create_message(payload: MessageCreate) -> dict[str, Any]:
    pool = get_pool()
    message = await save_message(pool, payload.message)
    return message


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    pool = get_pool()
    await websocket.accept()
    await app.state.connections.add(websocket)

    try:
        history = await fetch_recent_messages(pool)
        await websocket.send_json({"type": "history", "messages": history})

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await app.state.connections.remove(websocket)


@app.get("/healthz")
async def healthcheck() -> dict[str, str]:
    pool = get_pool()
    async with pool.acquire() as conn:
        await conn.execute("SELECT 1")
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}
