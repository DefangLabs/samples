"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { getProfileLabel, profileCatalog, simulationProfiles, type SimulationProfile } from "@/lib/demo";

type Job = {
  id: string;
  status: string;
  progress: number;
  summary: string | null;
  error: string | null;
  profile: string | null;
  scaleFactor: number | null;
  durationSeconds: number | null;
  updatedAt: string;
};

type Dashboard = {
  documentCount: number;
  taskCount: number;
  openTicketCount: number;
  activityCount: number;
  triagedCount: number;
  embeddingCount: number;
  latestJob: Job | null;
};

type QueueState = {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
};

type Ticket = {
  externalId: string;
  title: string;
  status: string;
  priority: string;
  owner: string;
  summary: string;
  source: string;
  customer: string | null;
  tags: string[];
  category: string | null;
  riskScore: number | null;
  recommendedAction: string | null;
};

type Activity = {
  externalId: string;
  kind: string;
  title: string;
  body: string;
  source: string;
  customer: string | null;
  tags: string[];
  category: string | null;
  riskScore: number | null;
  occurredAt: string;
};

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function statusClass(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "failed") return "status-critical";
  if (normalized === "completed") return "status-healthy";
  return "status-neutral";
}

export default function OpsPage() {
  const [syncProfile, setSyncProfile] = useState<SimulationProfile>("rollout");
  const [scaleFactor, setScaleFactor] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [queueState, setQueueState] = useState<QueueState | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [syncing, setSyncing] = useState(false);

  async function loadAll() {
    const [dashboardResponse, jobsResponse] = await Promise.all([
      fetch("/api/dashboard", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);

    if (!dashboardResponse.ok || !jobsResponse.ok) {
      throw new Error("Failed to load ops data");
    }

    const dashboardJson = await dashboardResponse.json();
    const jobsJson = await jobsResponse.json();

    setDashboard(dashboardJson.snapshot);
    setQueueState(dashboardJson.queue ?? null);
    setJobs(jobsJson.jobs);
    setTickets(jobsJson.tickets);
    setActivities(jobsJson.activities);
  }

  useEffect(() => {
    void loadAll().catch(() => {
      // Ignore initial fetch errors.
    });

    const interval = window.setInterval(() => {
      void loadAll().catch(() => {
        // Ignore transient polling errors.
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/jobs/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile: syncProfile,
          scaleFactor,
          durationSeconds,
        }),
      });
      await loadAll();
    } finally {
      setSyncing(false);
    }
  }

  return (
    <main className="ops-shell">
      <header className="ops-header reveal">
        <div>
          <span className="pill-label">Architecture & Runtime</span>
          <h1 className="hero-title">How the app works under the hood</h1>
          <p className="hero-subtitle">
            This view is intentionally technical. It shows the Next.js app, BullMQ worker, PostgreSQL tables,
            Redis queue, semantic index, and model endpoints that power the sample.
          </p>
        </div>

        <div className="topbar-actions">
          <div className="sync-controls">
            <label>
              Scenario
              <select
                className="sync-select"
                value={syncProfile}
                onChange={(event) => setSyncProfile(event.target.value as SimulationProfile)}
                disabled={syncing}
              >
                {simulationProfiles.map((profile) => (
                  <option key={profile} value={profile}>
                    {profileCatalog[profile].label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Scale
              <select
                className="sync-select"
                value={scaleFactor}
                onChange={(event) => setScaleFactor(Number(event.target.value))}
                disabled={syncing}
              >
                <option value={1}>1x</option>
                <option value={2}>2x</option>
                <option value={3}>3x</option>
                <option value={4}>4x</option>
                <option value={5}>5x</option>
              </select>
            </label>

            <label>
              Duration
              <select
                className="sync-select"
                value={durationSeconds}
                onChange={(event) => setDurationSeconds(Number(event.target.value))}
                disabled={syncing}
              >
                <option value={60}>1 min</option>
                <option value={120}>2 min</option>
                <option value={180}>3 min</option>
              </select>
            </label>
          </div>

          <button className="primary-button" disabled={syncing} onClick={handleSync}>
            {syncing ? "Queueing simulation..." : "Queue simulation"}
          </button>
          <Link className="ghost-link" href="/">
            Back to app
          </Link>
        </div>
      </header>

      <section className="ops-grid reveal delay-1">
        <article className="card">
          <span className="section-kicker">Runtime Counters</span>
          <h2>Persisted state and index coverage</h2>
          <div className="ops-kpi-grid">
            <div className="kpi">
              <label>Seed docs loaded</label>
              <strong>{dashboard?.documentCount ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Task rows</label>
              <strong>{dashboard?.taskCount ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Open tasks</label>
              <strong>{dashboard?.openTicketCount ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Event rows</label>
              <strong>{dashboard?.activityCount ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Triage rows</label>
              <strong>{dashboard?.triagedCount ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Embeddings stored</label>
              <strong>{dashboard?.embeddingCount ?? 0}</strong>
            </div>
          </div>
          <p className="muted-text subtle-gap">
            Latest sync update: {formatTimestamp(dashboard?.latestJob?.updatedAt)}
            {dashboard?.latestJob
              ? ` · ${dashboard.latestJob.status} · ${getProfileLabel(dashboard.latestJob.profile)} @ ${dashboard.latestJob.scaleFactor ?? 1}x`
              : ""}
          </p>
        </article>

        <article className="card">
          <span className="section-kicker">Service Topology</span>
          <h2>Process and dependency graph</h2>
          <div className="architecture-grid">
            <div className="architecture-node">Next.js app router + API routes</div>
            <div className="architecture-node">Mastra agent runtime</div>
            <div className="architecture-node">BullMQ worker process</div>
            <div className="architecture-node">Redis queue backend</div>
            <div className="architecture-node">PostgreSQL state tables</div>
            <div className="architecture-node">LLM chat endpoint</div>
            <div className="architecture-node">Embedding endpoint</div>
          </div>
        </article>
      </section>

      <section className="ops-grid reveal delay-2">
        <article className="card">
          <span className="section-kicker">Queue State</span>
          <h2>BullMQ counters from Redis</h2>
          <div className="ops-kpi-grid">
            <div className="kpi">
              <label>Waiting</label>
              <strong>{queueState?.waiting ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Active</label>
              <strong>{queueState?.active ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Delayed</label>
              <strong>{queueState?.delayed ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Completed</label>
              <strong>{queueState?.completed ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Failed</label>
              <strong>{queueState?.failed ?? 0}</strong>
            </div>
            <div className="kpi">
              <label>Paused</label>
              <strong>{queueState?.paused ?? 0}</strong>
            </div>
          </div>
          <p className="muted-text subtle-gap">
            Each simulation enqueues one <code>workspace-sync</code> job. That job persists generated rows and fans
            out one <code>triage-item</code> job per task or event.
          </p>
        </article>

        <article className="card">
          <span className="section-kicker">Job History</span>
          <h2>Background execution timeline</h2>
          <div className="job-list">
            {jobs.length === 0 ? (
              <p className="muted-text">No jobs yet.</p>
            ) : (
              jobs.map((job) => (
                <div className="job-item" key={job.id}>
                  <div className="inline-row">
                    <strong>{job.id}</strong>
                    <span className={`status-pill ${statusClass(job.status)}`}>{job.status}</span>
                  </div>
                  <div className="progress-track">
                    <span className="progress-value" style={{ width: `${job.progress}%` }} />
                  </div>
                  <p className="muted-text">
                    {getProfileLabel(job.profile)} · {job.scaleFactor ?? 1}x · {job.durationSeconds ?? 60}s
                  </p>
                  <p className="muted-text">{job.summary ?? "Pending worker update"}</p>
                  {job.error ? <p className="muted-text">{job.error}</p> : null}
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="ops-grid reveal delay-3">
        <article className="card">
          <span className="section-kicker">Execution Path</span>
          <h2>What each component does</h2>
          <div className="mini-list">
            <div className="mini-item">
              <strong>1. API route enqueues work</strong>
              <p className="muted-text">
                <code>/api/jobs/sync</code> creates a <code>sync_jobs</code> row and pushes a <code>workspace-sync</code> job into BullMQ.
              </p>
            </div>
            <div className="mini-item">
              <strong>2. Worker generates inbound rows</strong>
              <p className="muted-text">
                The worker synthesizes inbound tasks and events, then persists them into the <code>tickets</code> and <code>activities</code> tables.
              </p>
            </div>
            <div className="mini-item">
              <strong>3. Worker fans out triage jobs</strong>
              <p className="muted-text">
                For each persisted row, the worker adds a <code>triage-item</code> job so classification and indexing happen independently.
              </p>
            </div>
            <div className="mini-item">
              <strong>4. Triage writes structured state</strong>
              <p className="muted-text">
                The chat model assigns category, priority, risk, tags, and recommended action, then stores those results in <code>triage_events</code>.
              </p>
            </div>
            <div className="mini-item">
              <strong>5. Embeddings power similarity search</strong>
              <p className="muted-text">
                The embedding endpoint produces vectors that are stored with each triage row and later used by the copilot for semantic lookup.
              </p>
            </div>
          </div>
        </article>

        <article className="card">
          <span className="section-kicker">Persisted Records</span>
          <h2>Rows stored by the ingestion pipeline</h2>
          <div className="ops-columns">
            <div>
              <h3>Tasks table</h3>
              <div className="mini-list">
                {tickets.map((ticket) => (
                  <div className="mini-item" key={ticket.externalId}>
                    <div className="inline-row">
                      <strong>{ticket.externalId}</strong>
                      <span className="status-pill status-neutral">{ticket.priority}</span>
                    </div>
                    <p>{ticket.title}</p>
                    <p className="muted-text">
                      {ticket.status} · {ticket.owner} · {ticket.source}
                    </p>
                    <p className="muted-text">
                      {ticket.category ? `${ticket.category} · ` : ""}
                      {ticket.riskScore ? `Risk ${ticket.riskScore}` : "Awaiting classification"}
                    </p>
                    {ticket.tags.length > 0 ? <p className="muted-text">{ticket.tags.slice(0, 4).join(" · ")}</p> : null}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3>Events table</h3>
              <div className="mini-list">
                {activities.map((activity) => (
                  <div className="mini-item" key={activity.externalId}>
                    <div className="inline-row">
                      <strong>{activity.title}</strong>
                      <span className="status-pill status-neutral">{activity.kind}</span>
                    </div>
                    <p className="muted-text">{formatTimestamp(activity.occurredAt)}</p>
                    <p className="muted-text">{activity.body}</p>
                    <p className="muted-text">
                      {activity.source}
                      {activity.customer ? ` · ${activity.customer}` : ""}
                      {activity.category ? ` · ${activity.category}` : ""}
                      {activity.riskScore ? ` · Risk ${activity.riskScore}` : ""}
                    </p>
                    {activity.tags.length > 0 ? (
                      <p className="muted-text">{activity.tags.slice(0, 4).join(" · ")}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>
      </section>
    </main>
  );
}
