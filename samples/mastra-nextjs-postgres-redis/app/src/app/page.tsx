"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { companyContext, getProfileLabel, profileCatalog, simulationProfiles, type SimulationProfile } from "@/lib/demo";

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

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  state?: "streaming" | "complete" | "error";
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

type ChatStreamEvent =
  | { type: "meta"; threadId: string }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

const starterPrompts = [
  "What should I look at first?",
  "Summarize the latest issues in plain English.",
  "Draft a customer-safe update for Northwind Labs.",
  "Find similar incidents and suggest next actions.",
];

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function priorityClass(priority: string) {
  const normalized = priority.toLowerCase();
  if (normalized === "critical") return "status-critical";
  if (normalized === "high") return "status-high";
  if (normalized === "medium") return "status-medium";
  return "status-low";
}

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function Page() {
  const [syncProfile, setSyncProfile] = useState<SimulationProfile>("rollout");
  const [scaleFactor, setScaleFactor] = useState(1);
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [prompt, setPrompt] = useState("What should I look at first?");
  const [syncing, setSyncing] = useState(false);
  const [sending, setSending] = useState(false);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  async function loadAll() {
    const [dashboardResponse, jobsResponse] = await Promise.all([
      fetch("/api/dashboard", { cache: "no-store" }),
      fetch("/api/jobs", { cache: "no-store" }),
    ]);

    if (!dashboardResponse.ok || !jobsResponse.ok) {
      throw new Error("Failed to load workspace data");
    }

    const dashboardJson = await dashboardResponse.json();
    const jobsJson = await jobsResponse.json();
    setDashboard(dashboardJson.snapshot);
    setTickets(jobsJson.tickets);
    setActivities(jobsJson.activities);
  }

  useEffect(() => {
    void loadAll().catch(() => {
      // Keep UI usable even if initial fetch fails.
    });

    const interval = window.setInterval(() => {
      void loadAll().catch(() => {
        // Ignore transient polling errors.
      });
    }, 4000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [messages]);

  const topTickets = useMemo(() => tickets.slice(0, 4), [tickets]);
  const topActivities = useMemo(() => activities.slice(0, 4), [activities]);
  const hasConversation = messages.length > 0;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    setPrompt("");
    setSending(true);
    const assistantMessageId = createMessageId();

    setMessages((prev) => [
      ...prev,
      { id: createMessageId(), role: "user", content: currentPrompt, state: "complete" },
      { id: assistantMessageId, role: "assistant", content: "", state: "streaming" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/x-ndjson",
        },
        body: JSON.stringify({ message: currentPrompt, threadId, stream: true }),
      });

      if (!response.ok) {
        throw new Error("Copilot response failed");
      }

      const contentType = response.headers.get("content-type") ?? "";
      const isStreamResponse = contentType.includes("application/x-ndjson");

      if (response.body && isStreamResponse) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const applyEvent = (streamEvent: ChatStreamEvent) => {
          if (streamEvent.type === "meta") {
            setThreadId(streamEvent.threadId);
            return;
          }

          if (streamEvent.type === "delta") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, state: "streaming", content: message.content + streamEvent.text }
                  : message,
              ),
            );
            return;
          }

          if (streamEvent.type === "done") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      state: "complete",
                      content: message.content || "The copilot finished without returning text.",
                    }
                  : message,
              ),
            );
            return;
          }

          if (streamEvent.type === "error") {
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantMessageId
                  ? {
                      ...message,
                      state: "error",
                      content: message.content || streamEvent.message,
                    }
                  : message,
              ),
            );
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex >= 0) {
            const rawEvent = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (rawEvent) {
              try {
                applyEvent(JSON.parse(rawEvent) as ChatStreamEvent);
              } catch {
                // Ignore malformed stream chunks.
              }
            }

            newlineIndex = buffer.indexOf("\n");
          }
        }

        buffer += decoder.decode();
        const trailingEvent = buffer.trim();
        if (trailingEvent) {
          try {
            applyEvent(JSON.parse(trailingEvent) as ChatStreamEvent);
          } catch {
            // Ignore malformed trailing chunk.
          }
        }
      } else {
        const json = await response.json();
        if (json.threadId) {
          setThreadId(json.threadId);
        }

        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMessageId
              ? {
                  ...message,
                  state: "complete",
                  content: typeof json.reply === "string" ? json.reply : "The copilot finished without returning text.",
                }
              : message,
          ),
        );
      }
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? {
                ...message,
                state: "error",
                content: "I couldn't generate a response right now. Refresh context and try again.",
              }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="experience-layout">
      <aside className="chat-rail reveal">
        <div className="card chat-card">
          <span className="section-kicker">Copilot</span>
          <h2>Ask the copilot</h2>
          <p className="muted-text chat-intro">Use the latest classified tasks and events to get a quick answer.</p>

          <div className="chat-log" ref={chatLogRef}>
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                No conversation yet. Ask what changed, what needs attention, or what you should tell a customer.
              </div>
            ) : (
              messages.map((message) => (
                <div className={`chat-message ${message.role} ${message.state ?? "complete"}`} key={message.id}>
                  {message.content ? (
                    message.role === "assistant" ? (
                      <div className="chat-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span>{message.content}</span>
                    )
                  ) : null}
                  {message.state === "streaming" && !message.content ? (
                    <span className="typing-placeholder">
                      Reviewing tasks and events
                      <span className="typing-dots" aria-hidden="true">
                        <span />
                        <span />
                        <span />
                      </span>
                    </span>
                  ) : null}
                  {message.state === "streaming" && message.content ? <span className="stream-cursor" aria-hidden="true" /> : null}
                </div>
              ))
            )}
          </div>

          {!hasConversation ? (
            <div className="suggestion-row">
              {starterPrompts.map((suggestion) => (
                <button
                  className="suggestion-chip"
                  key={suggestion}
                  onClick={() => setPrompt(suggestion)}
                  type="button"
                  disabled={sending}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <form className="chat-form" onSubmit={handleSubmit}>
            <div className="chat-compose">
              <textarea
                className="chat-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    event.currentTarget.form?.requestSubmit();
                  }
                }}
                placeholder="Ask what needs attention, what changed, or what to tell a customer..."
                disabled={sending}
              />
              <button className="primary-button chat-send-button" disabled={sending}>
                {sending ? "..." : "Ask"}
              </button>
            </div>
          </form>
        </div>
      </aside>

      <div className="experience-shell">
        <header className="topbar reveal">
          <div className="topbar-copy">
            <span className="pill-label">{companyContext.commandCenterName}</span>
            <h1 className="hero-title">See what needs attention across your tools</h1>
            <p className="hero-subtitle">
              Tasks come from work tools like Jira, GitHub, and Linear. Events come from systems like deploys, sync
              jobs, alerts, and monitoring. New items are classified automatically and made available to the copilot.
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
                  disabled={syncing || sending}
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
                  disabled={syncing || sending}
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
                  disabled={syncing || sending}
                >
                  <option value={60}>1 min</option>
                  <option value={120}>2 min</option>
                  <option value={180}>3 min</option>
                </select>
              </label>
            </div>

            <button className="primary-button" disabled={syncing || sending} onClick={handleSync}>
              {syncing ? "Queueing simulation..." : "Generate sample activity"}
            </button>
            <Link className="ghost-link" href="/ops">
              View system internals
            </Link>
          </div>
        </header>

        <section className="snapshot-card reveal delay-1">
          <article className="card freshness-card">
            <span className="section-kicker">Current Snapshot</span>
            <p className="muted-text subtle-gap">{profileCatalog[syncProfile].shortSummary}</p>
            <div className="kpi-grid">
              <div className="kpi">
                <label>Open tasks</label>
                <strong>{dashboard?.openTicketCount ?? 0}</strong>
              </div>
              <div className="kpi">
                <label>Recent events</label>
                <strong>{dashboard?.activityCount ?? 0}</strong>
              </div>
              <div className="kpi">
                <label>Reference docs</label>
                <strong>{dashboard?.documentCount ?? 0}</strong>
              </div>
              <div className="kpi">
                <label>Classified items</label>
                <strong>{dashboard?.triagedCount ?? 0}</strong>
              </div>
            </div>
            <p className="muted-text subtle-gap">
              Latest refresh: {formatTimestamp(dashboard?.latestJob?.updatedAt)}
              {dashboard?.latestJob
                ? ` · ${dashboard.latestJob.status} · ${getProfileLabel(dashboard.latestJob.profile)} @ ${dashboard.latestJob.scaleFactor ?? 1}x`
                : ""}
            </p>
          </article>
        </section>

        <section className="workspace-grid reveal delay-2">
          <article className="card">
            <span className="section-kicker">Tasks</span>
            <h2>Open tasks</h2>
            <p className="muted-text section-blurb">Tasks assigned to people in tools like Jira, GitHub, and Linear.</p>
            <div className="ticket-list">
              {topTickets.length === 0 ? (
                <p className="muted-text">No tasks loaded yet. Generate sample activity to populate the queue.</p>
              ) : (
                topTickets.map((ticket) => (
                  <div className="ticket-card" key={ticket.externalId}>
                    <div className="inline-row">
                      <strong>{ticket.externalId}</strong>
                      <span className={`status-pill ${priorityClass(ticket.priority)}`}>{ticket.priority}</span>
                    </div>
                    <p className="ticket-title">{ticket.title}</p>
                    <p className="muted-text compact-meta">
                      {ticket.status} · {ticket.owner} · {ticket.source}
                    </p>
                    <p className="muted-text item-summary">{ticket.summary}</p>
                    <p className="muted-text compact-meta">
                      {ticket.customer ? `${ticket.customer} · ` : ""}
                      {ticket.category ? `${ticket.category} · ` : ""}
                      {ticket.riskScore ? `Risk ${ticket.riskScore}` : "Pending classification"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="card">
            <span className="section-kicker">Events</span>
            <h2>Recent events</h2>
            <p className="muted-text section-blurb">Events from across our systems like deploys, sync jobs, alerts, and monitoring.</p>
            <div className="activity-stream">
              {topActivities.length === 0 ? (
                <p className="muted-text">No activity loaded yet.</p>
              ) : (
                topActivities.map((activity) => (
                  <div className="activity-card" key={activity.externalId}>
                    <div className="inline-row">
                      <strong>{activity.title}</strong>
                      <span className="status-pill status-neutral">{activity.kind}</span>
                    </div>
                    <p className="muted-text compact-meta">{formatTimestamp(activity.occurredAt)}</p>
                    <p className="muted-text item-summary">{activity.body}</p>
                    <p className="muted-text compact-meta">
                      {activity.source}
                      {activity.customer ? ` · ${activity.customer}` : ""}
                      {activity.category ? ` · ${activity.category}` : ""}
                      {activity.riskScore ? ` · Risk ${activity.riskScore}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>

        <section className="footer-note reveal delay-4">
          <p>
            Want the backend view? Open the <Link href="/ops">system internals page</Link> for queue history, storage, and service details.
          </p>
        </section>
      </div>
    </main>
  );
}
