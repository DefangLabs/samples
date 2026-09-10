"""Lightweight mock copilot that queries the database directly."""

from __future__ import annotations

from lib.items import get_item_counts, get_items_by_type


async def get_mock_reply(message: str) -> str:
    counts = await get_item_counts()
    tickets = await get_items_by_type("ticket", limit=5)
    alerts = await get_items_by_type("alert", limit=5)

    total = counts["ticketCount"] + counts["alertCount"]
    if total == 0:
        return (
            "There are no items in the system yet. "
            "Click **Generate sample items** to create some tickets and alerts, "
            "then ask me about them."
        )

    msg = message.lower()

    if "first" in msg or "urgent" in msg or "priority" in msg or "look at" in msg:
        critical = [t for t in tickets if t.priority in ("critical", "high")]
        if critical:
            top = critical[0]
            return (
                f"I'd start with **{top.title}** (priority: {top.priority}, "
                f"source: {top.source}). It's assigned to {top.assignee or 'unassigned'}."
            )
        return "No critical or high-priority tickets at the moment. Things look calm."

    if "summar" in msg:
        return (
            f"There are **{counts['ticketCount']} tickets** and "
            f"**{counts['alertCount']} alerts**. "
            f"{counts['classifiedCount']} items have been classified so far."
        )

    if "related" in msg or "similar" in msg or "pattern" in msg:
        tags_seen: set[str] = set()
        for item in tickets + alerts:
            tags_seen.update(item.tags)
        if tags_seen:
            return (
                f"Common themes across items: {', '.join(sorted(tags_seen)[:8])}. "
                "Try asking about a specific tag to drill in."
            )
        return "Items haven't been classified yet. Wait for the worker to finish, then ask again."

    return (
        f"The system currently has {counts['ticketCount']} tickets and "
        f"{counts['alertCount']} alerts. Ask me to summarize, find urgent items, "
        "or look for patterns."
    )
