/**
 * Dashboard state hook. Connects to the SSE stream at /api/dashboard/stream
 * for real-time updates on item counts, seed-run progress, and queue depth.
 * Falls back to polling if the SSE connection drops. Items (tasks/events)
 * are refreshed whenever the seed-run status changes.
 */

"use client";

import { useEffect, useRef, useState } from "react";

import type { DashboardResponse, Item } from "@/app/types";

async function fetchItems() {
  const response = await fetch("/api/items", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as { tasks: Item[]; events: Item[] };
}

async function fetchDashboard() {
  const response = await fetch("/api/dashboard", { cache: "no-store" });
  if (!response.ok) return null;
  return (await response.json()) as DashboardResponse;
}

export function useDashboard() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [tasks, setTasks] = useState<Item[]>([]);
  const [events, setEvents] = useState<Item[]>([]);
  const [seeding, setSeeding] = useState(false);
  const lastRunStatusRef = useRef<string | null>(null);

  async function loadItems() {
    const data = await fetchItems();
    if (data) {
      setTasks(data.tasks);
      setEvents(data.events);
    }
  }

  useEffect(() => {
    void loadItems().catch(() => {});

    const eventSource = new EventSource("/api/dashboard/stream");
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data) as DashboardResponse;
      setDashboard(data);

      const currentStatus = data.latestRun?.status ?? null;
      const previousStatus = lastRunStatusRef.current;
      lastRunStatusRef.current = currentStatus;

      if (
        currentStatus !== previousStatus ||
        currentStatus === "running" ||
        currentStatus === "queued"
      ) {
        void loadItems().catch(() => {});
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      if (!fallbackInterval) {
        fallbackInterval = setInterval(() => {
          void fetchDashboard()
            .then((data) => { if (data) setDashboard(data); })
            .catch(() => {});
          void loadItems().catch(() => {});
        }, 3000);
      }
    };

    return () => {
      eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  async function handleSeed() {
    setSeeding(true);
    try {
      const response = await fetch("/api/items/seed", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to enqueue sample item generation");
      }
      await loadItems();
    } finally {
      setSeeding(false);
    }
  }

  return { dashboard, tasks, events, seeding, handleSeed };
}
