"""PostgreSQL connection pool and schema migration using asyncpg."""

from __future__ import annotations

import os

import asyncpg

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        dsn = os.environ.get("DATABASE_URL")
        if not dsn:
            raise RuntimeError("DATABASE_URL is not configured")
        _pool = await asyncpg.create_pool(dsn, min_size=2, max_size=10)
    return _pool


_schema_ready = False


async def ensure_schema() -> None:
    global _schema_ready
    if _schema_ready:
        return
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute("CREATE EXTENSION IF NOT EXISTS vector")
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS seed_runs (
                id TEXT PRIMARY KEY,
                status TEXT NOT NULL,
                total_items INTEGER NOT NULL DEFAULT 20,
                processed_items INTEGER NOT NULL DEFAULT 0,
                summary TEXT,
                error TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
        """)
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS items (
                id BIGSERIAL PRIMARY KEY,
                run_id TEXT REFERENCES seed_runs(id) ON DELETE SET NULL,
                item_type TEXT NOT NULL,
                source TEXT NOT NULL,
                title TEXT NOT NULL,
                body TEXT NOT NULL,
                status TEXT,
                assignee TEXT,
                category TEXT,
                priority TEXT,
                tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
                embedding vector,
                processed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT items_item_type_check CHECK (item_type IN ('ticket', 'alert'))
            )
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS items_item_type_created_idx
            ON items (item_type, created_at DESC)
        """)
        await conn.execute("""
            CREATE INDEX IF NOT EXISTS items_run_id_idx ON items (run_id)
        """)
    _schema_ready = True


async def close_pool() -> None:
    global _pool, _schema_ready
    if _pool:
        await _pool.close()
        _pool = None
        _schema_ready = False
