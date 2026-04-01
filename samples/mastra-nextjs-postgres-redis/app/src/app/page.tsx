"use client";

import { FormEvent, useEffect, useState } from "react";

type Job = {
  id: string;
  status: string;
  progress: number;
  summary: string | null;
  error: string | null;
  updatedAt: string;
};

type Dashboard = {
  documentCount: number;
  openTicketCount: number;
  activityCount: number;
  latestJob: Job | null;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Ticket = {
  externalId: string;
  title: string;
  status: string;
  priority: string;
  owner: string;
  summary: string;
};

type Activity = {
  kind: string;
  title: string;
  body: string;
  occurredAt: string;
};

export default function Page() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Queue a workspace sync first, then ask me to summarize incidents, rank tickets, or draft release notes.",
    },
  ]);
  const [prompt, setPrompt] = useState("What should the on-call engineer look at first?");
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);

  async function loadAll() {
    const [dashboardResponse, jobsResponse] = await Promise.all([
      fetch("/api/dashboard", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);

    const dashboardJson = await dashboardResponse.json();
    const jobsJson = await jobsResponse.json();
    setDashboard(dashboardJson.snapshot);
    setJobs(jobsJson.jobs);
    setTickets(jobsJson.tickets);
    setActivities(jobsJson.activities);
  }

  useEffect(() => {
    void loadAll();
    const interval = window.setInterval(() => {
      void loadAll();
    }, 2500);

    return () => window.clearInterval(interval);
  }, []);

  async function handleSync() {
    setSyncing(true);
    try {
      await fetch("/api/jobs/sync", {
        method: "POST",
      });
      await loadAll();
    } finally {
      setSyncing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    setPrompt("");
    setSending(true);
    setMessages((prev) => [...prev, { role: "user", content: currentPrompt }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentPrompt }),
      });
      const json = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: json.reply }]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">Mastra + Next.js + Postgres + Redis</span>
          <h1>Ship the whole support ops stack, not just the chat box.</h1>
          <p>
            This sample combines a Mastra copilot, a queue-backed sync worker, durable state in PostgreSQL,
            and Redis-backed jobs. It is the kind of internal AI tool that actually needs multiple services.
          </p>
          <div className="feature-row">
            <span className="feature-chip">Mastra agent tools</span>
            <span className="feature-chip">BullMQ worker</span>
            <span className="feature-chip">Managed Postgres + Redis</span>
            <span className="feature-chip">Defang LLM-ready compose</span>
          </div>
        </div>
        <div className="hero-panel card">
          <span className="section-label">Stack shape</span>
          <h2>What this sample is proving</h2>
          <div className="hero-services">
            <span className="service-pill">Web UI</span>
            <span className="service-pill">Mastra agent</span>
            <span className="service-pill">Background worker</span>
            <span className="service-pill">Queue + state</span>
          </div>
          <p className="muted">
            Sync the workspace, inspect the queue, and ask the copilot to triage live operational context instead of
            chatting with a toy prompt.
          </p>
        </div>
      </section>

      <section className="grid">
        <div className="stack">
          <div className="card">
            <span className="section-label">Sync + storage</span>
            <div className="toolbar">
              <div>
                <h2>Workspace snapshot</h2>
                <p className="muted">Sync the sample workspace to load tickets, runbooks, and recent launch activity.</p>
              </div>
              <button className="button" disabled={syncing} onClick={handleSync}>
                {syncing ? "Queueing..." : "Sync sample workspace"}
              </button>
            </div>

            <div className="stats">
              <div className="stat">
                <label>Knowledge docs</label>
                <strong>{dashboard?.documentCount ?? 0}</strong>
              </div>
              <div className="stat">
                <label>Open tickets</label>
                <strong>{dashboard?.openTicketCount ?? 0}</strong>
              </div>
              <div className="stat">
                <label>Recent activity</label>
                <strong>{dashboard?.activityCount ?? 0}</strong>
              </div>
            </div>
          </div>

          <div className="card">
            <span className="section-label">Queue visibility</span>
            <h2>Background jobs</h2>
            <div className="list">
              {jobs.length === 0 ? (
                <p className="muted">No jobs yet. Queue a sync to populate the workspace.</p>
              ) : (
                jobs.map((job) => (
                  <div className="job" key={job.id}>
                    <div className="toolbar">
                      <strong>{job.id}</strong>
                      <span className={`pill ${job.status === "failed" ? "critical" : "healthy"}`}>{job.status}</span>
                    </div>
                    <div className="progress">
                      <span style={{ width: `${job.progress}%` }} />
                    </div>
                    <span className="muted">{job.summary ?? "Waiting for worker update..."}</span>
                    {job.error ? <span className="muted">{job.error}</span> : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <span className="section-label">Prioritized work</span>
            <h2>Open tickets</h2>
            <div className="list">
              {tickets.map((ticket) => (
                <div className="list-item" key={ticket.externalId}>
                  <div className="toolbar">
                    <strong>{ticket.externalId}</strong>
                    <span className={`pill ${ticket.priority === "critical" ? "critical" : "healthy"}`}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p>{ticket.title}</p>
                  <p className="muted">
                    {ticket.status} · {ticket.owner}
                  </p>
                  <p className="muted">{ticket.summary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card copilot-card">
            <span className="section-label">Agent surface</span>
            <h2>Mastra copilot</h2>
            <div className="chat-log">
              {messages.map((message, index) => (
                <div className={`message ${message.role}`} key={`${message.role}-${index}`}>
                  {message.content}
                </div>
              ))}
            </div>

            <form className="composer" onSubmit={handleSubmit}>
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask for incident summaries, release notes, ticket triage, or launch blockers."
              />
              <div className="composer-actions">
                <span className="muted">Try: incident summary, release notes, launch blockers, on-call triage</span>
                <button className="button" disabled={sending}>
                  {sending ? "Thinking..." : "Ask the copilot"}
                </button>
              </div>
            </form>
          </div>

          <div className="card">
            <span className="section-label">Operational context</span>
            <h2>Recent activity</h2>
            <div className="list">
              {activities.map((activity) => (
                <div className="list-item" key={`${activity.kind}-${activity.occurredAt}`}>
                  <div className="toolbar">
                    <strong>{activity.title}</strong>
                    <span className="pill">{activity.kind}</span>
                  </div>
                  <p className="muted">{new Date(activity.occurredAt).toLocaleString()}</p>
                  <p className="muted">{activity.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
