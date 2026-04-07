"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type SeedRun = {
  id: string;
  status: string;
  totalItems: number;
  processedItems: number;
  summary: string | null;
  error: string | null;
  updatedAt: string;
};

type DashboardResponse = {
  counts: {
    taskCount: number;
    eventCount: number;
    classifiedCount: number;
  };
  latestRun: SeedRun | null;
  queue: {
    waiting: number;
    active: number;
  };
};

type Item = {
  id: number;
  itemType: "task" | "event";
  source: string;
  title: string;
  body: string;
  status: string | null;
  assignee: string | null;
  category: string | null;
  priority: string | null;
  tags: string[];
  processedAt: string | null;
  createdAt: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: ChatTraceEvent[];
  state?: "streaming" | "complete" | "error";
};

type ChatTraceEvent =
  | { id: string; type: "thinking"; text: string }
  | { id: string; type: "tool_call"; toolName: string; args: unknown }
  | { id: string; type: "tool_result"; toolName: string; summary: string };

type ChatStreamEvent =
  | { type: "meta"; threadId: string }
  | { type: "delta"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_call"; toolName: string; args: unknown }
  | { type: "tool_result"; toolName: string; summary: string }
  | { type: "done" }
  | { type: "error"; message: string };

const starterPrompts = [
  "What should I look at first?",
  "Summarize the current tasks and events.",
  "Which items seem related?",
  "What patterns are you seeing?",
];

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Not started yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatPriority(priority: string | null) {
  if (!priority) return "pending";
  return priority;
}

function priorityClass(priority: string | null) {
  const normalized = priority?.toLowerCase() ?? "";
  if (normalized === "critical") return "status-critical";
  if (normalized === "high") return "status-high";
  if (normalized === "medium") return "status-medium";
  return "status-low";
}

function formatToolArgs(args: unknown) {
  if (!args || typeof args !== "object") {
    return "no filters";
  }

  const entries = Object.entries(args).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) return "no filters";

  return entries
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(", ");
}

export default function Page() {
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null);
  const [tasks, setTasks] = useState<Item[]>([]);
  const [events, setEvents] = useState<Item[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("What should I look at first?");
  const [threadId, setThreadId] = useState<string | undefined>();
  const [seeding, setSeeding] = useState(false);
  const [sending, setSending] = useState(false);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  async function loadAll() {
    const [dashboardResponse, itemsResponse] = await Promise.all([
      fetch("/api/dashboard", { cache: "no-store" }),
      fetch("/api/items", { cache: "no-store" }),
    ]);

    if (!dashboardResponse.ok || !itemsResponse.ok) {
      throw new Error("Failed to load demo state");
    }

    const dashboardJson = (await dashboardResponse.json()) as DashboardResponse;
    const itemsJson = (await itemsResponse.json()) as { tasks: Item[]; events: Item[] };

    setDashboard(dashboardJson);
    setTasks(itemsJson.tasks);
    setEvents(itemsJson.events);
  }

  useEffect(() => {
    void loadAll().catch(() => {
      // Keep the page usable even if an initial load fails.
    });

    const interval = window.setInterval(() => {
      void loadAll().catch(() => {
        // Ignore transient polling errors.
      });
    }, 3000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [messages]);

  const latestRun = dashboard?.latestRun ?? null;
  const statusLabel = latestRun
    ? latestRun.status === "running" || latestRun.status === "queued"
      ? `Processing ${latestRun.processedItems}/${latestRun.totalItems}`
      : latestRun.status === "completed"
        ? `Ready · ${latestRun.totalItems} items`
        : "Run failed"
    : "No items yet";
  const hasConversation = messages.length > 0;

  const taskSummary = useMemo(() => dashboard?.counts.taskCount ?? 0, [dashboard]);
  const eventSummary = useMemo(() => dashboard?.counts.eventCount ?? 0, [dashboard]);
  const classifiedSummary = useMemo(() => dashboard?.counts.classifiedCount ?? 0, [dashboard]);

  async function handleSeed() {
    setSeeding(true);
    try {
      const response = await fetch("/api/items/seed", { method: "POST" });
      if (!response.ok) {
        throw new Error("Failed to enqueue sample item generation");
      }
      await loadAll();
    } finally {
      setSeeding(false);
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

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Streaming response unavailable");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      const appendTrace = (traceEvent: ChatTraceEvent) => {
        setMessages((prev) =>
          prev.map((message) => {
            if (message.id !== assistantMessageId) return message;

            const trace = message.trace ?? [];
            const lastTrace = trace[trace.length - 1];

            if (traceEvent.type === "thinking" && lastTrace?.type === "thinking") {
              return {
                ...message,
                trace: [...trace.slice(0, -1), { ...lastTrace, text: lastTrace.text + traceEvent.text }],
              };
            }

            return { ...message, trace: [...trace, traceEvent] };
          }),
        );
      };

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

        if (streamEvent.type === "thinking") {
          appendTrace({ id: createMessageId(), type: "thinking", text: streamEvent.text });
          return;
        }

        if (streamEvent.type === "tool_call") {
          appendTrace({
            id: createMessageId(),
            type: "tool_call",
            toolName: streamEvent.toolName,
            args: streamEvent.args,
          });
          return;
        }

        if (streamEvent.type === "tool_result") {
          appendTrace({
            id: createMessageId(),
            type: "tool_result",
            toolName: streamEvent.toolName,
            summary: streamEvent.summary,
          });
          return;
        }

        if (streamEvent.type === "done") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? { ...message, state: "complete", content: message.content || "No response text returned." }
                : message,
            ),
          );
          return;
        }

        if (streamEvent.type === "error") {
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMessageId
                ? { ...message, state: "error", content: message.content || streamEvent.message }
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
            applyEvent(JSON.parse(rawEvent) as ChatStreamEvent);
          }

          newlineIndex = buffer.indexOf("\n");
        }
      }

      const trailing = buffer.trim();
      if (trailing) {
        applyEvent(JSON.parse(trailing) as ChatStreamEvent);
      }
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? { ...message, state: "error", content: "The copilot could not answer that right now." }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="app-shell">
      <aside className="chat-rail">
        <div className="card chat-card">
          <div>
            <span className="eyebrow">Copilot</span>
            <h1 className="chat-title">Ask about the current state of the system</h1>
            <p className="muted-text chat-intro">
              The chat agent can inspect tasks, events, and semantic matches before it answers.
            </p>
          </div>

          {!hasConversation ? (
            <div className="suggestion-row">
              {starterPrompts.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => setPrompt(suggestion)}
                  disabled={sending}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}

          <div className="chat-log" ref={chatLogRef}>
            {messages.length === 0 ? (
              <div className="chat-empty-state">
                Generate sample items, then ask what matters, what looks related, or what needs attention first.
              </div>
            ) : null}

            {messages.map((message) => (
              <div key={message.id} className={`chat-message ${message.role} ${message.state ?? "complete"}`}>
                {message.role === "assistant" ? (
                  <div className="chat-markdown">
                    {message.trace && message.trace.length > 0 ? (
                      <div className="trace-stack" aria-label="Agent tool trace">
                        {message.trace.map((traceEvent) => {
                          if (traceEvent.type === "thinking") {
                            return (
                              <details key={traceEvent.id} className="trace-item thinking-trace" open>
                                <summary>Thinking</summary>
                                <p>{traceEvent.text.trim()}</p>
                              </details>
                            );
                          }

                          if (traceEvent.type === "tool_call") {
                            return (
                              <div key={traceEvent.id} className="trace-item tool-trace">
                                <span>Tool call</span>
                                <strong>{traceEvent.toolName}</strong>
                                <code>{formatToolArgs(traceEvent.args)}</code>
                              </div>
                            );
                          }

                          return (
                            <div key={traceEvent.id} className="trace-item tool-trace result-trace">
                              <span>Tool result</span>
                              <strong>{traceEvent.toolName}</strong>
                              <code>{traceEvent.summary}</code>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || "Working..."}</ReactMarkdown>
                    {message.state === "streaming" ? <span className="stream-cursor" aria-hidden="true" /> : null}
                  </div>
                ) : (
                  message.content
                )}
              </div>
            ))}
          </div>

          <form className="chat-form" onSubmit={handleSubmit}>
            <div className="chat-compose">
              <textarea
                className="chat-input"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                placeholder="Ask about the tasks, the events, or similar items"
                disabled={sending}
              />
              <button className="primary-button chat-send-button" type="submit" disabled={sending || !prompt.trim()}>
                Ask
              </button>
            </div>
          </form>
        </div>
      </aside>

      <main className="content-shell">
        <section className="card hero-card">
          <div className="hero-copy">
            <span className="eyebrow">Tasks and events</span>
            <h2>Background jobs classify incoming work and system activity.</h2>
            <p className="muted-text">
              Click one button to generate 10 tasks and 10 events. The worker fans that out into per-item jobs, stores
              the results in Postgres, and builds embeddings for semantic lookup.
            </p>
          </div>

          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={handleSeed} disabled={seeding}>
              {seeding ? "Queueing..." : "Generate sample items"}
            </button>
            <div className="status-panel">
              <div>
                <span className="status-label">Status</span>
                <strong>{statusLabel}</strong>
              </div>
              <span className="muted-text">Updated {formatTimestamp(latestRun?.updatedAt)}</span>
            </div>
          </div>
        </section>

        <section className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Tasks</span>
            <strong>{taskSummary}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Events</span>
            <strong>{eventSummary}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Classified</span>
            <strong>{classifiedSummary}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Queue</span>
            <strong>{(dashboard?.queue.active ?? 0) + (dashboard?.queue.waiting ?? 0)}</strong>
          </div>
        </section>

        <section className="columns">
          <div className="card list-card">
            <div className="list-header">
              <span className="eyebrow">Open tasks</span>
              <p className="muted-text">Tasks assigned to people in tools like Jira, GitHub, and Linear.</p>
            </div>
            <div className="item-list">
              {tasks.length === 0 ? <div className="empty-list">No tasks yet.</div> : null}
              {tasks.map((task) => (
                <article key={task.id} className="item-card">
                  <div className="item-topline">
                    <span className="source-pill">{task.source}</span>
                    <span className={`priority-pill ${priorityClass(task.priority)}`}>{formatPriority(task.priority)}</span>
                  </div>
                  <h3>{task.title}</h3>
                  <p className="item-body">{task.body}</p>
                  <div className="meta-row">
                    <span>{task.assignee ? `Assigned to ${task.assignee}` : "Unassigned"}</span>
                    <span>{task.status ?? "pending"}</span>
                    <span>{task.category ?? "classifying"}</span>
                  </div>
                  {task.tags.length > 0 ? (
                    <div className="tag-row">
                      {task.tags.map((tag) => (
                        <span key={tag} className="tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>

          <div className="card list-card">
            <div className="list-header">
              <span className="eyebrow">Recent events</span>
              <p className="muted-text">Events from across our systems like deploys, alerts, sync jobs, and support channels.</p>
            </div>
            <div className="item-list">
              {events.length === 0 ? <div className="empty-list">No events yet.</div> : null}
              {events.map((event) => (
                <article key={event.id} className="item-card">
                  <div className="item-topline">
                    <span className="source-pill">{event.source}</span>
                    <span className={`priority-pill ${priorityClass(event.priority)}`}>{formatPriority(event.priority)}</span>
                  </div>
                  <h3>{event.title}</h3>
                  <p className="item-body">{event.body}</p>
                  <div className="meta-row">
                    <span>{formatTimestamp(event.createdAt)}</span>
                    <span>{event.category ?? "classifying"}</span>
                  </div>
                  {event.tags.length > 0 ? (
                    <div className="tag-row">
                      {event.tags.map((tag) => (
                        <span key={tag} className="tag-pill">
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
