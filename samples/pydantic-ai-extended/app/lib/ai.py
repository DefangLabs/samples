"""LLM communication: seed generation, classification, and embedding."""

from __future__ import annotations

import hashlib
import json
import math
import os
import re

import httpx

from lib.items import ItemClassification, ItemType, RawItemSeed
from lib.model import get_chat_model, get_embedding_config, has_chat_access, has_embedding_access
from lib.seed_data import fallback_alerts, fallback_tickets


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _has_llm_access() -> bool:
    return has_chat_access()


def _use_fast_local_data() -> bool:
    return os.environ.get("LOCAL_FAST_DATA") == "true"


def _parse_json_from_text(text: str) -> object:
    """Extracts JSON from LLM output, handling markdown fences."""
    text = text.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    candidate = match.group(1).strip() if match else text
    try:
        return json.loads(candidate)
    except json.JSONDecodeError:
        # Try to find a JSON object or array
        for start, end in [("{", "}"), ("[", "]")]:
            first = candidate.find(start)
            last = candidate.rfind(end)
            if first >= 0 and last > first:
                return json.loads(candidate[first : last + 1])
        raise ValueError("Invalid JSON payload returned by model")


# ---------------------------------------------------------------------------
# Pydantic AI agent for generation
# ---------------------------------------------------------------------------

async def _run_chat_json(system_prompt: str, user_prompt: str) -> object | None:
    if not _has_llm_access() or os.environ.get("MOCK_AGENT") == "true":
        return None
    from pydantic_ai import Agent

    model = get_chat_model()
    agent = Agent(model, instructions=system_prompt)
    result = await agent.run(user_prompt)
    return _parse_json_from_text(result.output)


# ---------------------------------------------------------------------------
# Embeddings
# ---------------------------------------------------------------------------

def _deterministic_embedding(text: str, dimensions: int = 192) -> list[float]:
    """Generates a stable fake embedding from text using SHA-256."""
    buckets = [0.0] * dimensions
    digest = hashlib.sha256(text.encode()).digest()
    for i, ch in enumerate(text):
        code = ord(ch)
        bucket = (code + digest[i % len(digest)]) % dimensions
        direction = 1 if digest[(i * 7) % len(digest)] % 2 == 0 else -1
        buckets[bucket] += direction * ((code % 13) + 1)
    magnitude = math.sqrt(sum(v * v for v in buckets)) or 1.0
    return [v / magnitude for v in buckets]


async def embed_text_for_search(text: str) -> list[float]:
    if os.environ.get("MOCK_AGENT") == "true" or not has_embedding_access():
        return _deterministic_embedding(text)
    try:
        base_url, model_id, api_key = get_embedding_config()
        url = f"{base_url.rstrip('/')}/embeddings"
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                url,
                json={"input": text, "model": model_id},
                headers={"Authorization": f"Bearer {api_key}"},
            )
            resp.raise_for_status()
            return resp.json()["data"][0]["embedding"]
    except Exception:
        return _deterministic_embedding(text)


# ---------------------------------------------------------------------------
# Classification (with regex fallbacks)
# ---------------------------------------------------------------------------

def _fallback_category(text: str) -> str:
    t = text.lower()
    if re.search(r"(deploy|release|workflow|rollback)", t):
        return "delivery"
    if re.search(r"(payment|invoice|billing|subscription)", t):
        return "billing"
    if re.search(r"(latency|timeout|slow|memory|performance)", t):
        return "performance"
    if re.search(r"(import|sync|webhook|integration|duplicate)", t):
        return "integration"
    if re.search(r"(error|exception|incident|alert|500)", t):
        return "incident"
    if re.search(r"(auth|login|sso|password|token|403)", t):
        return "authentication"
    return "operations"


def _fallback_priority(text: str) -> str:
    t = text.lower()
    if re.search(r"(critical|rollback|paged|blocked|failing|unresponsive)", t):
        return "critical"
    if re.search(r"(error|duplicate|latency|failed|degraded|spike)", t):
        return "high"
    if re.search(r"(planned|review|verify|update|warning)", t):
        return "medium"
    return "low"


def _fallback_tags(text: str) -> list[str]:
    t = text.lower()
    tags: set[str] = set()
    if re.search(r"(api|latency|timeout|performance|memory)", t):
        tags.add("performance")
    if re.search(r"(deploy|release|workflow|rollback)", t):
        tags.add("delivery")
    if re.search(r"(payment|invoice|billing|subscription|stripe)", t):
        tags.add("billing")
    if re.search(r"(import|sync|webhook|integration)", t):
        tags.add("integration")
    if re.search(r"(customer|support|report)", t):
        tags.add("customer")
    if re.search(r"(bug|error|exception|incident|alert|500)", t):
        tags.add("incident")
    if re.search(r"(auth|login|sso|password|token|certificate)", t):
        tags.add("auth")
    if len(tags) < 2:
        tags.add("ops")
        tags.add("triage")
    return list(tags)[:4]


async def classify_item(
    item: RawItemSeed | ItemClassification | dict,
) -> ItemClassification:
    # Accept dict-like or dataclass
    if isinstance(item, dict):
        source = item.get("source", "")
        title = item.get("title", "")
        body = item.get("body", "")
        item_type = item.get("item_type", "ticket")
    else:
        source = getattr(item, "source", "")
        title = getattr(item, "title", "")
        body = getattr(item, "body", "")
        item_type = getattr(item, "item_type", "ticket")

    if _use_fast_local_data() or not _has_llm_access() or os.environ.get("MOCK_AGENT") == "true":
        text = f"{source} {title} {body}"
        return ItemClassification(
            category=_fallback_category(text),
            priority=_fallback_priority(text),
            tags=_fallback_tags(text),
        )

    payload = await _run_chat_json(
        "You classify incoming support tickets and system alerts. Return valid JSON only.",
        "\n".join([
            f"Item type: {item_type}",
            f"Source: {source}",
            f"Title: {title}",
            f"Body: {body}",
            "Return this exact shape:",
            '{"category":"...","priority":"low|medium|high|critical","tags":["tag-one","tag-two"]}',
            "Keep category short and practical, like incident, delivery, billing, performance, integration, authentication, or support.",
            "Return 2 to 4 tags.",
            "Do not include markdown.",
        ]),
    )

    if payload and isinstance(payload, dict):
        return ItemClassification(
            category=str(payload.get("category", "operations")),
            priority=str(payload.get("priority", "medium")),
            tags=[str(t) for t in payload.get("tags", ["ops", "triage"])][:4],
        )

    text = f"{source} {title} {body}"
    return ItemClassification(
        category=_fallback_category(text),
        priority=_fallback_priority(text),
        tags=_fallback_tags(text),
    )


# ---------------------------------------------------------------------------
# Seed item generation
# ---------------------------------------------------------------------------

async def generate_seed_items() -> list[RawItemSeed]:
    if _use_fast_local_data() or not _has_llm_access() or os.environ.get("MOCK_AGENT") == "true":
        return fallback_tickets + fallback_alerts

    tickets_payload = await _run_chat_json(
        "You generate realistic support ticket records. Return valid JSON only.",
        "\n".join([
            "Generate exactly 10 support ticket records for a SaaS product team.",
            "These tickets should look like real issues from tools like Zendesk, Intercom, Jira, Linear, and GitHub Issues.",
            "Avoid fake enterprise jargon. Keep them concrete and easy to understand.",
            "Return this exact shape:",
            '{"tickets":[{"source":"Zendesk","title":"...","body":"...","status":"open|in progress|blocked|planned","assignee":"..."}]}',
            "Do not include markdown.",
        ]),
    )

    alerts_payload = await _run_chat_json(
        "You generate realistic system alert records. Return valid JSON only.",
        "\n".join([
            "Generate exactly 10 alert records for a SaaS product team.",
            "These alerts should look like notifications from tools like Datadog, PagerDuty, Sentry, Vercel, Stripe, GitHub Actions, and AWS CloudWatch.",
            "Avoid fake enterprise jargon. Keep them concrete and easy to understand.",
            "Return this exact shape:",
            '{"alerts":[{"source":"Datadog","title":"...","body":"..."}]}',
            "Do not include markdown.",
        ]),
    )

    items: list[RawItemSeed] = []

    if tickets_payload and isinstance(tickets_payload, dict):
        for t in tickets_payload.get("tickets", [])[:10]:
            items.append(RawItemSeed(
                item_type="ticket",
                source=str(t.get("source", "Unknown")),
                title=str(t.get("title", "Untitled")),
                body=str(t.get("body", "")),
                status=t.get("status"),
                assignee=t.get("assignee"),
            ))

    if alerts_payload and isinstance(alerts_payload, dict):
        for a in alerts_payload.get("alerts", [])[:10]:
            items.append(RawItemSeed(
                item_type="alert",
                source=str(a.get("source", "Unknown")),
                title=str(a.get("title", "Untitled")),
                body=str(a.get("body", "")),
            ))

    if not items:
        return fallback_tickets + fallback_alerts

    return items


# ---------------------------------------------------------------------------
# Embedding text builder
# ---------------------------------------------------------------------------

def text_for_embedding(
    item: RawItemSeed | dict,
    classification: ItemClassification,
) -> str:
    if isinstance(item, dict):
        parts = [
            item.get("item_type", ""),
            item.get("source", ""),
            item.get("title", ""),
            item.get("body", ""),
        ]
    else:
        parts = [item.item_type, item.source, item.title, item.body]
    parts.extend([classification.category, classification.priority])
    parts.append(" ".join(classification.tags))
    return "\n".join(parts)
