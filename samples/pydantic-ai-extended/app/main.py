"""
FastAPI application serving the UI and API endpoints.

Routes:
  GET  /              - Serves the HTML UI
  GET  /api/health    - Health check
  GET  /api/dashboard - Dashboard data (counts, latest run, queue)
  GET  /api/items     - List tickets and alerts
  POST /api/items/seed - Kick off seed generation
  POST /api/chat      - Copilot endpoint (streaming NDJSON or JSON)
"""

from __future__ import annotations

import json
import os
import uuid

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from agents.copilot import CopilotDeps, copilot_agent
from lib.db import close_pool, ensure_schema
from lib.items import get_item_counts, get_items_by_type, get_latest_run
from lib.mock_agent import get_mock_reply
from lib.queue import enqueue_job, get_queue_length

app = FastAPI()
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


@app.on_event("startup")
async def startup() -> None:
    await ensure_schema()


@app.on_event("shutdown")
async def shutdown() -> None:
    await close_pool()


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------


@app.get("/api/dashboard")
async def dashboard() -> dict:
    latest_run = await get_latest_run()
    counts = await get_item_counts()
    queue_len = await get_queue_length()
    return {
        "latestRun": {
            "id": latest_run.id,
            "status": latest_run.status,
            "totalItems": latest_run.total_items,
            "processedItems": latest_run.processed_items,
            "summary": latest_run.summary,
            "error": latest_run.error,
            "updatedAt": latest_run.updated_at,
        }
        if latest_run
        else None,
        "counts": counts,
        "queue": {"pending": queue_len},
    }


# ---------------------------------------------------------------------------
# Items
# ---------------------------------------------------------------------------


@app.get("/api/items")
async def list_items() -> dict:
    tickets = await get_items_by_type("ticket", limit=10)
    alerts = await get_items_by_type("alert", limit=10)
    return {
        "tickets": [
            {
                "id": t.id,
                "source": t.source,
                "title": t.title,
                "body": t.body,
                "status": t.status,
                "assignee": t.assignee,
                "category": t.category,
                "priority": t.priority,
                "tags": t.tags,
                "processedAt": t.processed_at,
            }
            for t in tickets
        ],
        "alerts": [
            {
                "id": a.id,
                "source": a.source,
                "title": a.title,
                "body": a.body,
                "category": a.category,
                "priority": a.priority,
                "tags": a.tags,
                "processedAt": a.processed_at,
            }
            for a in alerts
        ],
    }


# ---------------------------------------------------------------------------
# Seed
# ---------------------------------------------------------------------------


@app.post("/api/items/seed")
async def seed_items() -> dict:
    from lib.items import create_seed_run

    run_id = str(uuid.uuid4())
    await create_seed_run(run_id)
    await enqueue_job("seed-batch", {"runId": run_id})
    return {"runId": run_id}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------


@app.post("/api/chat")
async def chat(request: Request) -> StreamingResponse | JSONResponse:
    await ensure_schema()
    body = await request.json()
    message = body.get("message", "")
    stream = body.get("stream", False)
    thread_id = body.get("threadId", str(uuid.uuid4()))

    if not message:
        return JSONResponse(
            {"error": "A message is required."}, status_code=400
        )

    if stream:
        return _streaming_response(message, thread_id)
    else:
        return await _non_streaming_response(message, thread_id)


def _streaming_response(message: str, thread_id: str) -> StreamingResponse:
    async def generate():
        yield json.dumps({"type": "meta", "threadId": thread_id}) + "\n"

        if os.environ.get("MOCK_AGENT") == "true":
            reply = await get_mock_reply(message)
            for word in reply.split():
                yield json.dumps({"type": "delta", "text": word + " "}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
            return

        try:
            async with copilot_agent.run_stream(
                message, deps=CopilotDeps(), message_history=[]
            ) as response:
                async for text in response.stream_text(delta=True):
                    if text:
                        yield json.dumps({"type": "delta", "text": text}) + "\n"
            yield json.dumps({"type": "done"}) + "\n"
        except Exception as exc:
            # Fallback to mock on agent failure
            try:
                reply = await get_mock_reply(message)
                for word in reply.split():
                    yield json.dumps({"type": "delta", "text": word + " "}) + "\n"
                yield json.dumps({"type": "done"}) + "\n"
            except Exception:
                yield json.dumps({"type": "error", "message": str(exc)}) + "\n"

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        headers={"Cache-Control": "no-cache, no-transform"},
    )


async def _non_streaming_response(
    message: str, thread_id: str
) -> JSONResponse:
    if os.environ.get("MOCK_AGENT") == "true":
        reply = await get_mock_reply(message)
        return JSONResponse({"reply": reply, "threadId": thread_id})

    try:
        result = await copilot_agent.run(
            message, deps=CopilotDeps(), message_history=[]
        )
        reply = result.output
        if not reply:
            raise ValueError("Agent returned no text")
        return JSONResponse({"reply": reply, "threadId": thread_id})
    except Exception:
        reply = await get_mock_reply(message)
        return JSONResponse({"reply": reply, "threadId": thread_id})


# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------


@app.get("/", response_class=HTMLResponse)
async def index(request: Request) -> HTMLResponse:
    return templates.TemplateResponse("index.html", {"request": request})
