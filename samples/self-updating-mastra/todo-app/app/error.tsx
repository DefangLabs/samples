"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// Segment error boundary: shows a calm fallback and reports the error to the
// backlog. Because this is a self-updating app, a broken page becomes a task
// the admin can hand to the coding agent.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(
      "Render error: " + (error.message || "unknown") + (error.digest ? ` (digest ${error.digest})` : ""),
    );
  }, [error]);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
      <p className="mt-3 text-slate-600">
        This page hit an error. It has been reported to the administrator, who can ask the coding
        agent to fix it.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-slate-950 px-5 py-2.5 font-bold text-white transition hover:bg-violet-700"
      >
        Try again
      </button>
    </div>
  );
}
