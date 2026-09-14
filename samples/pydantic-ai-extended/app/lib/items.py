"""Item CRUD operations against PostgreSQL."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from lib.db import get_pool

ItemType = Literal["ticket", "alert"]


@dataclass
class SeedRun:
    id: str
    status: str
    total_items: int
    processed_items: int
    summary: str | None
    error: str | None
    created_at: str
    updated_at: str


@dataclass
class ItemRecord:
    id: int
    run_id: str | None
    item_type: ItemType
    source: str
    title: str
    body: str
    status: str | None
    assignee: str | None
    category: str | None
    priority: str | None
    tags: list[str]
    processed_at: str | None
    created_at: str
    updated_at: str


@dataclass
class ItemClassification:
    category: str
    priority: str
    tags: list[str]


@dataclass
class RawItemSeed:
    item_type: ItemType
    source: str
    title: str
    body: str
    status: str | None = None
    assignee: str | None = None


@dataclass
class ItemFilters:
    status: str | None = None
    assignee: str | None = None
    source: str | None = None
    category: str | None = None
    priority: str | None = None
    tag: str | None = None
    query: str | None = None


def _map_run(row: dict) -> SeedRun:
    return SeedRun(
        id=str(row["id"]),
        status=str(row["status"]),
        total_items=int(row["total_items"]),
        processed_items=int(row["processed_items"]),
        summary=row.get("summary"),
        error=row.get("error"),
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
    )


def _map_item(row: dict) -> ItemRecord:
    return ItemRecord(
        id=int(row["id"]),
        run_id=row.get("run_id"),
        item_type=row["item_type"],
        source=str(row["source"]),
        title=str(row["title"]),
        body=str(row["body"]),
        status=row.get("status"),
        assignee=row.get("assignee"),
        category=row.get("category"),
        priority=row.get("priority"),
        tags=list(row.get("tags") or []),
        processed_at=str(row["processed_at"]) if row.get("processed_at") else None,
        created_at=str(row["created_at"]),
        updated_at=str(row["updated_at"]),
    )


async def create_seed_run(run_id: str, total_items: int = 20) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        INSERT INTO seed_runs (id, status, total_items, processed_items, summary, error)
        VALUES ($1, 'queued', $2, 0, 'Queued item generation job', NULL)
        """,
        run_id,
        total_items,
    )


async def start_seed_run(run_id: str, summary: str) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        UPDATE seed_runs
        SET status = 'running', summary = $2, error = NULL, updated_at = NOW()
        WHERE id = $1
        """,
        run_id,
        summary,
    )


async def finish_seed_run(run_id: str, summary: str) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        UPDATE seed_runs
        SET status = 'completed', summary = $2, updated_at = NOW()
        WHERE id = $1
        """,
        run_id,
        summary,
    )


async def fail_seed_run(run_id: str, error: str) -> None:
    pool = await get_pool()
    await pool.execute(
        """
        UPDATE seed_runs
        SET status = 'failed', error = $2, summary = 'Background processing failed',
            updated_at = NOW()
        WHERE id = $1
        """,
        run_id,
        error,
    )


async def get_latest_run() -> SeedRun | None:
    pool = await get_pool()
    row = await pool.fetchrow(
        "SELECT * FROM seed_runs ORDER BY created_at DESC LIMIT 1"
    )
    return _map_run(row) if row else None


async def insert_seed_items(run_id: str, items: list[RawItemSeed]) -> list[ItemRecord]:
    pool = await get_pool()
    inserted: list[ItemRecord] = []
    for item in items:
        row = await pool.fetchrow(
            """
            INSERT INTO items (run_id, item_type, source, title, body, status, assignee)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            """,
            run_id,
            item.item_type,
            item.source,
            item.title,
            item.body,
            item.status,
            item.assignee,
        )
        inserted.append(_map_item(row))
    return inserted


async def get_item_by_id(item_id: int) -> ItemRecord | None:
    pool = await get_pool()
    row = await pool.fetchrow("SELECT * FROM items WHERE id = $1", item_id)
    return _map_item(row) if row else None


async def update_processed_item(
    item_id: int, classification: ItemClassification, embedding: list[float]
) -> ItemRecord | None:
    pool = await get_pool()
    vector_literal = f"[{','.join(str(v) for v in embedding)}]"
    row = await pool.fetchrow(
        """
        UPDATE items
        SET category = $2, priority = $3, tags = $4,
            embedding = $5::vector, processed_at = NOW(), updated_at = NOW()
        WHERE id = $1
        RETURNING *
        """,
        item_id,
        classification.category,
        classification.priority,
        classification.tags,
        vector_literal,
    )
    return _map_item(row) if row else None


async def mark_item_processed(run_id: str) -> SeedRun | None:
    pool = await get_pool()
    row = await pool.fetchrow(
        """
        UPDATE seed_runs
        SET processed_items = processed_items + 1, updated_at = NOW()
        WHERE id = $1
        RETURNING *
        """,
        run_id,
    )
    return _map_run(row) if row else None


def _apply_filters(
    clauses: list[str], values: list, filters: ItemFilters | None = None
) -> None:
    if not filters:
        return
    if filters.status:
        values.append(filters.status)
        clauses.append(f"LOWER(status) = LOWER(${len(values)})")
    if filters.assignee:
        values.append(f"%{filters.assignee}%")
        clauses.append(f"assignee ILIKE ${len(values)}")
    if filters.source:
        values.append(f"%{filters.source}%")
        clauses.append(f"source ILIKE ${len(values)}")
    if filters.category:
        values.append(filters.category)
        clauses.append(f"LOWER(category) = LOWER(${len(values)})")
    if filters.priority:
        values.append(filters.priority)
        clauses.append(f"LOWER(priority) = LOWER(${len(values)})")
    if filters.tag:
        values.append(filters.tag)
        clauses.append(
            f"EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE LOWER(t) = LOWER(${len(values)}))"
        )
    if filters.query:
        values.append(f"%{filters.query}%")
        idx = len(values)
        clauses.append(
            f"(title ILIKE ${idx} OR body ILIKE ${idx} OR source ILIKE ${idx} "
            f"OR category ILIKE ${idx} "
            f"OR EXISTS (SELECT 1 FROM unnest(tags) AS t WHERE t ILIKE ${idx}))"
        )


async def get_items_by_type(
    item_type: ItemType, limit: int = 10, filters: ItemFilters | None = None
) -> list[ItemRecord]:
    pool = await get_pool()
    clauses = ["item_type = $1"]
    values: list = [item_type]
    _apply_filters(clauses, values, filters)
    values.append(limit)
    sql = f"""
        SELECT * FROM items
        WHERE {' AND '.join(clauses)}
        ORDER BY created_at DESC, id DESC
        LIMIT ${len(values)}
    """
    rows = await pool.fetch(sql, *values)
    return [_map_item(r) for r in rows]


async def get_item_counts() -> dict:
    pool = await get_pool()
    row = await pool.fetchrow("""
        SELECT
            COUNT(*) FILTER (WHERE item_type = 'ticket')::int AS ticket_count,
            COUNT(*) FILTER (WHERE item_type = 'alert')::int AS alert_count,
            COUNT(*) FILTER (WHERE processed_at IS NOT NULL)::int AS classified_count
        FROM items
    """)
    return {
        "ticketCount": int(row["ticket_count"] or 0),
        "alertCount": int(row["alert_count"] or 0),
        "classifiedCount": int(row["classified_count"] or 0),
    }


async def get_available_tags(item_type: ItemType | None = None) -> list[dict]:
    pool = await get_pool()
    if item_type:
        rows = await pool.fetch(
            """
            SELECT t AS tag, COUNT(*)::int AS count
            FROM items CROSS JOIN LATERAL unnest(tags) AS t
            WHERE item_type = $1
            GROUP BY t ORDER BY count DESC, t ASC
            """,
            item_type,
        )
    else:
        rows = await pool.fetch("""
            SELECT t AS tag, COUNT(*)::int AS count
            FROM items CROSS JOIN LATERAL unnest(tags) AS t
            GROUP BY t ORDER BY count DESC, t ASC
        """)
    return [{"tag": str(r["tag"]), "count": int(r["count"])} for r in rows]


async def search_items_by_embedding(
    embedding: list[float],
    item_type: ItemType | None = None,
    limit: int = 5,
    filters: ItemFilters | None = None,
) -> list[dict]:
    pool = await get_pool()
    vector_literal = f"[{','.join(str(v) for v in embedding)}]"
    clauses = ["processed_at IS NOT NULL", "embedding IS NOT NULL"]
    values: list = [vector_literal, limit]

    if item_type:
        values.append(item_type)
        clauses.append(f"item_type = ${len(values)}")

    _apply_filters(clauses, values, filters)

    rows = await pool.fetch(
        f"""
        SELECT *, 1 - (embedding <=> $1::vector) AS score
        FROM items
        WHERE {' AND '.join(clauses)}
        ORDER BY embedding <=> $1::vector
        LIMIT $2
        """,
        *values,
    )
    return [
        {"item": _map_item(r), "score": round(float(r["score"]), 4)}
        for r in rows
    ]
