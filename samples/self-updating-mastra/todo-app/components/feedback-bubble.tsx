"use client";

import { useState, type FormEvent } from "react";

export function FeedbackBubble() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ body: String(form.get("body") ?? "") }),
    });

    if (!response.ok) {
      const result = (await response.json().catch(() => null)) as { error?: string } | null;
      setError(result?.error ?? "Could not send feedback.");
      setPending(false);
      return;
    }

    setSent(true);
    setPending(false);
  }

  function close() {
    setOpen(false);
    setSent(false);
    setError("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed bottom-6 right-6 grid h-14 w-14 place-items-center rounded-full bg-violet-600 text-white shadow-xl shadow-violet-300 transition hover:scale-105 hover:bg-violet-700"
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="h-6 w-6">
          <path
            d="M5 5.75h14v9.5H9l-4 3v-12.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
          className="fixed inset-0 z-20 grid place-items-center bg-slate-950/40 px-5 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-3xl bg-white p-7 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="feedback-title" className="text-2xl font-bold text-slate-950">
                  Help rewrite this app
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Tell the administrator what would make your todo list better.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close feedback dialog"
                className="text-2xl leading-none text-slate-400 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            {sent ? (
              <div className="mt-7 rounded-2xl bg-emerald-50 p-5 text-emerald-800">
                <p className="font-bold">Thank you!</p>
                <p className="mt-1 text-sm">Your feedback is ready for the coding agent.</p>
                <button type="button" onClick={close} className="mt-4 text-sm font-bold underline">
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6">
                <textarea
                  name="body"
                  required
                  minLength={3}
                  maxLength={2000}
                  rows={6}
                  placeholder="I wish the app could…"
                  className="w-full resize-none rounded-2xl border border-slate-300 p-4 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                />
                {error ? (
                  <p role="alert" className="mt-3 text-sm text-rose-700">
                    {error}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={pending}
                  className="mt-4 w-full rounded-xl bg-violet-600 px-4 py-3 font-bold text-white hover:bg-violet-700 disabled:opacity-60"
                >
                  {pending ? "Sending…" : "Send feedback"}
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
