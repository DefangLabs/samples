"use client";

import { ChatMessageView } from "@/app/components/chat-message";
import { ItemCard } from "@/app/components/item-card";
import { formatTimestamp } from "@/app/formatting";
import { useChat } from "@/app/hooks/use-chat";
import { useDashboard } from "@/app/hooks/use-dashboard";

const starterPrompts = [
  "What should I look at first?",
  "Summarize the current tasks and events.",
  "Which items seem related?",
  "What patterns are you seeing?",
];

export default function Page() {
  const { dashboard, tasks, events, seeding, handleSeed } = useDashboard();
  const { messages, prompt, setPrompt, chatLogRef, sending, handleSubmit } = useChat();

  const latestRun = dashboard?.latestRun ?? null;
  const hasConversation = messages.length > 0;

  const seedRunStatus = latestRun
    ? latestRun.status === "running" || latestRun.status === "queued"
      ? `Processing ${latestRun.processedItems}/${latestRun.totalItems}`
      : latestRun.status === "completed"
        ? `Ready · ${latestRun.totalItems} items`
        : "Run failed"
    : "No items yet";

  const taskCount = dashboard?.counts.taskCount ?? 0;
  const eventCount = dashboard?.counts.eventCount ?? 0;
  const classifiedCount = dashboard?.counts.classifiedCount ?? 0;
  const queueCount = (dashboard?.queue.active ?? 0) + (dashboard?.queue.waiting ?? 0);

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
              <ChatMessageView key={message.id} message={message} />
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
                <strong>{seedRunStatus}</strong>
              </div>
              <span className="muted-text">Updated {formatTimestamp(latestRun?.updatedAt)}</span>
            </div>
          </div>
        </section>

        <section className="stats-row">
          <div className="stat-card">
            <span className="stat-label">Tasks</span>
            <strong>{taskCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Events</span>
            <strong>{eventCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Classified</span>
            <strong>{classifiedCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Queue</span>
            <strong>{queueCount}</strong>
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
                <ItemCard key={task.id} item={task} showAssignee />
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
                <ItemCard key={event.id} item={event} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
