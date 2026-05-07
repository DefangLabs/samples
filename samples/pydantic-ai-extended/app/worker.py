"""
Background worker that processes jobs from the Redis queue.

Job types:
  - seed-batch: Generate sample tickets and alerts, insert them, then fan out
    per-item classify jobs.
  - classify-item: Classify a single item and generate its embedding.
"""

from __future__ import annotations

import asyncio
import sys
import traceback

from lib.ai import classify_item, embed_text_for_search, generate_seed_items, text_for_embedding
from lib.db import ensure_schema
from lib.items import (
    ItemClassification,
    fail_seed_run,
    finish_seed_run,
    get_item_by_id,
    insert_seed_items,
    mark_item_processed,
    start_seed_run,
    update_processed_item,
)
from lib.queue import dequeue_job, enqueue_job


async def handle_seed_batch(run_id: str) -> None:
    await start_seed_run(run_id, "Generating 10 tickets and 10 alerts with the LLM")

    raw_items = await generate_seed_items()
    inserted = await insert_seed_items(run_id, raw_items)

    for item in inserted:
        await enqueue_job("classify-item", {"runId": run_id, "itemId": item.id})

    await start_seed_run(
        run_id, f"Queued {len(inserted)} background classification jobs"
    )


async def handle_classify_item(run_id: str, item_id: int) -> None:
    item = await get_item_by_id(item_id)
    if item is None:
        raise ValueError(f"Item {item_id} not found")

    item_dict = {
        "item_type": item.item_type,
        "source": item.source,
        "title": item.title,
        "body": item.body,
    }
    classification = await classify_item(item_dict)
    embedding = await embed_text_for_search(text_for_embedding(item_dict, classification))
    await update_processed_item(item.id, classification, embedding)
    run = await mark_item_processed(run_id)

    if run and run.processed_items >= run.total_items:
        await finish_seed_run(
            run_id,
            f"Generated {run.total_items} items and classified every one of them",
        )


async def main() -> None:
    await ensure_schema()
    print("ticket-sync worker is running", flush=True)

    while True:
        try:
            job = await dequeue_job(timeout=5)
            if job is None:
                continue

            name = job.get("name")
            data = job.get("data", {})

            if name == "seed-batch":
                await handle_seed_batch(data["runId"])
            elif name == "classify-item":
                await handle_classify_item(data["runId"], data["itemId"])
            else:
                print(f"Unknown job type: {name}", flush=True)

        except Exception:
            traceback.print_exc()
            run_id = None
            if isinstance(job, dict):
                run_id = job.get("data", {}).get("runId")
            if run_id:
                try:
                    await fail_seed_run(run_id, traceback.format_exc()[-200:])
                except Exception:
                    pass


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        sys.exit(0)
