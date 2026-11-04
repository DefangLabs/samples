"""
Pydantic AI copilot agent with tools for inspecting tickets, alerts, tags,
and semantic matches before answering questions.
"""

from __future__ import annotations

from dataclasses import dataclass

from pydantic_ai import Agent, RunContext

from lib.ai import embed_text_for_search
from lib.items import (
    ItemFilters,
    get_available_tags,
    get_items_by_type,
    search_items_by_embedding,
)
from lib.model import get_chat_model


@dataclass
class CopilotDeps:
    """No external deps needed; tools query the database directly."""
    pass


copilot_agent = Agent(
    get_chat_model,
    deps_type=CopilotDeps,
    instructions="""
    You are the copilot for a demo app that tracks support tickets and system alerts.
    Tickets are customer issues from tools like Zendesk, Intercom, Jira, Linear, and GitHub Issues.
    Alerts are system notifications from tools like Datadog, PagerDuty, Sentry, Vercel, and Stripe.

    Use tools before answering:
    - Use get_tickets for questions about customer issues, bugs, blockers, status, owners, priorities, categories, or tags.
    - Use get_alerts for questions about system alerts, incidents, deploys, monitoring, sources, categories, or tags.
    - Use get_tags to discover the classification vocabulary before filtering by tags or explaining patterns.
    - Use search_items when the user asks about similar issues, related items, or semantic matches.

    Investigation pattern:
    1. Start with the smallest useful tool call.
    2. If the first result is broad or ambiguous, refine with status, source, priority, category, tag, assignee, or query filters.
    3. For pattern questions, inspect tags first, then query tickets/alerts or search similar items.
    4. For cross-cutting questions, use at least two tools when it materially improves the answer.
    5. Stop once the evidence is sufficient; do not call tools just to use every tool.

    Final answer rules:
    - Base every final answer on tool output only.
    - Mention exact ticket/alert titles, owners or sources, priorities, categories, and tags when relevant.
    - If the user asks which items match a status or priority, name the exact matching items.
    - Keep the final answer concise and practical.
    If the system has no items yet, tell the user to generate sample items first.
    """,
)


@copilot_agent.tool
async def get_tickets(
    ctx: RunContext[CopilotDeps],
    status: str | None = None,
    assignee: str | None = None,
    source: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """Fetch support tickets with optional filters."""
    filters = ItemFilters(
        status=status,
        assignee=assignee,
        source=source,
        category=category,
        priority=priority,
        tag=tag,
        query=query,
    )
    items = await get_items_by_type("ticket", limit=limit, filters=filters)
    return [
        {
            "id": i.id,
            "source": i.source,
            "title": i.title,
            "body": i.body,
            "status": i.status,
            "assignee": i.assignee,
            "category": i.category,
            "priority": i.priority,
            "tags": i.tags,
        }
        for i in items
    ]


@copilot_agent.tool
async def get_alerts(
    ctx: RunContext[CopilotDeps],
    source: str | None = None,
    category: str | None = None,
    priority: str | None = None,
    tag: str | None = None,
    query: str | None = None,
    limit: int = 10,
) -> list[dict]:
    """Fetch system alerts with optional filters."""
    filters = ItemFilters(
        source=source,
        category=category,
        priority=priority,
        tag=tag,
        query=query,
    )
    items = await get_items_by_type("alert", limit=limit, filters=filters)
    return [
        {
            "id": i.id,
            "source": i.source,
            "title": i.title,
            "body": i.body,
            "category": i.category,
            "priority": i.priority,
            "tags": i.tags,
        }
        for i in items
    ]


@copilot_agent.tool
async def get_tags(
    ctx: RunContext[CopilotDeps],
    item_type: str | None = None,
) -> list[dict]:
    """Get all classification tags with their counts. Optionally filter by item_type ('ticket' or 'alert')."""
    t = item_type if item_type in ("ticket", "alert") else None
    return await get_available_tags(t)


@copilot_agent.tool
async def search_items(
    ctx: RunContext[CopilotDeps],
    search_query: str,
    item_type: str | None = None,
    limit: int = 5,
) -> list[dict]:
    """Semantic search across tickets and alerts. Returns the most similar items."""
    embedding = await embed_text_for_search(search_query)
    t = item_type if item_type in ("ticket", "alert") else None
    results = await search_items_by_embedding(embedding, item_type=t, limit=limit)
    return [
        {
            "title": r["item"].title,
            "source": r["item"].source,
            "body": r["item"].body,
            "category": r["item"].category,
            "priority": r["item"].priority,
            "tags": r["item"].tags,
            "score": r["score"],
        }
        for r in results
    ]
