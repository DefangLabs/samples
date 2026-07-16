"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export interface FeedbackItem {
  id: string;
  body: string;
  status: string;
  email: string;
  createdAt: string;
}

interface RunState {
  status: "running" | "done" | "failed";
  log: string;
}

const activeRunKey = "self-updating-mastra-active-run";

export function AdminConsole({ feedback }: { feedback: FeedbackItem[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<RunState | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedRun = window.localStorage.getItem(activeRunKey);
    if (storedRun) setRunId(storedRun);
  }, []);

  useEffect(() => {
    if (!runId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function poll() {
      const response = await fetch("/api/agent/status?runId=" + encodeURIComponent(runId as string), {
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as
        | (RunState & { error?: string })
        | null;

      if (cancelled) return;
      if (!response.ok || !result) {
        setError(result?.error ?? "Could not read the coding agent status.");
        timer = setTimeout(poll, 4000);
        return;
      }

      setRun({ status: result.status, log: result.log });
      setError("");
      if (result.status === "running") {
        timer = setTimeout(poll, 2000);
      } else {
        window.localStorage.removeItem(activeRunKey);
        router.refresh();
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [router, runId]);

  function toggle(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function dispatch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const instructions = String(form.get("instructions") ?? "").trim();

    const response = await fetch("/api/agent/dispatch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ feedbackIds: Array.from(selected), instructions }),
    });
    const result = (await response.json().catch(() => null)) as {
      runId?: string;
      error?: string;
    } | null;

    setPending(false);
    if (!response.ok || !result?.runId) {
      setError(result?.error ?? "Could not start the coding agent.");
      return;
    }

    window.localStorage.setItem(activeRunKey, result.runId);
    setRunId(result.runId);
    setRun({ status: "running", log: "Change request accepted. Waiting for the agent…" });
    setSelected(new Set());
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-violet-600">
              User feedback
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Choose what to improve
            </h1>
          </div>
          <span className="text-sm text-slate-400">{feedback.length} total</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {feedback.length ? (
            <ul className="divide-y divide-slate-100">
              {feedback.map((item) => {
                const selectable = item.status === "new";
                return (
                  <li key={item.id} className="p-5">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggle(item.id)}
                        disabled={!selectable}
                        aria-label={"Select feedback from " + item.email}
                        className="mt-1 h-4 w-4 accent-violet-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                          <span className="font-semibold text-slate-600">{item.email}</span>
                          <span>•</span>
                          <time dateTime={item.createdAt}>
                            {new Date(item.createdAt).toLocaleString()}
                          </time>
                          <span
                            className={
                              "rounded-full px-2 py-0.5 font-bold uppercase tracking-wide " +
                              (selectable
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700")
                            }
                          >
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                          {item.body}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-6 py-14 text-center text-slate-400">
              No feedback yet. The bubble in the corner is ready when users are.
            </p>
          )}
        </div>
      </section>

      <aside className="space-y-6">
        <form onSubmit={dispatch} className="rounded-2xl bg-slate-950 p-6 text-white shadow-xl">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-violet-300">
            Coding agent
          </p>
          <h2 className="mt-2 text-2xl font-bold">Shape the request</h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Add context, constraints, or a specific direction before the selected feedback reaches
            Mastra.
          </p>
          <textarea
            name="instructions"
            rows={7}
            maxLength={5000}
            placeholder="Instructions for the coding agent"
            className="mt-5 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400"
          />
          <button
            type="submit"
            disabled={pending}
            className="mt-4 w-full rounded-xl bg-violet-500 px-4 py-3 font-bold transition hover:bg-violet-400 disabled:opacity-60"
          >
            {pending
              ? "Starting…"
              : "Send to coding agent" + (selected.size ? " (" + selected.size + ")" : "")}
          </button>
          {error ? (
            <p role="alert" className="mt-3 rounded-lg bg-rose-950/60 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}
        </form>

        {runId ? (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Run</p>
                <p className="mt-1 font-mono text-xs text-slate-600">{runId.slice(0, 8)}</p>
              </div>
              <span
                className={
                  "rounded-full px-3 py-1 text-xs font-bold uppercase " +
                  (run?.status === "done"
                    ? "bg-emerald-100 text-emerald-700"
                    : run?.status === "failed"
                      ? "bg-rose-100 text-rose-700"
                      : "bg-violet-100 text-violet-700")
                }
              >
                {run?.status ?? "connecting"}
              </span>
            </div>
            <pre className="max-h-[28rem] min-h-40 overflow-auto whitespace-pre-wrap bg-slate-950 p-5 font-mono text-xs leading-5 text-slate-200">
              {run?.log ?? "Reading agent output…"}
            </pre>
            {run?.status === "done" ? (
              <p className="bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
                Changes are live. Refresh the app to explore them.
              </p>
            ) : null}
          </section>
        ) : null}
      </aside>
    </div>
  );
}
