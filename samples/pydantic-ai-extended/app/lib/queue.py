"""Simple Redis-based job queue using lists."""

from __future__ import annotations

import json
import os

import redis.asyncio as redis

QUEUE_NAME = os.environ.get("QUEUE_NAME", "ticket-sync")

_redis_conn: redis.Redis | None = None


def get_redis() -> redis.Redis:
    global _redis_conn
    if _redis_conn is None:
        url = os.environ.get("REDIS_URL")
        if not url:
            raise RuntimeError("REDIS_URL is not configured")
        _redis_conn = redis.from_url(url, decode_responses=True)
    return _redis_conn


async def enqueue_job(job_name: str, data: dict) -> None:
    r = get_redis()
    payload = json.dumps({"name": job_name, "data": data})
    await r.lpush(QUEUE_NAME, payload)


async def dequeue_job(timeout: int = 5) -> dict | None:
    r = get_redis()
    result = await r.brpop(QUEUE_NAME, timeout=timeout)
    if result is None:
        return None
    _, payload = result
    return json.loads(payload)


async def get_queue_length() -> int:
    r = get_redis()
    return await r.llen(QUEUE_NAME)
