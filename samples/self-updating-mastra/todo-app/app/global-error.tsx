"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// Root error boundary (catches errors in the root layout itself). Must render
// its own <html>/<body>. Also reports to the backlog.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(
      "Global error: " + (error.message || "unknown") + (error.digest ? ` (digest ${error.digest})` : ""),
    );
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          color: "#0f172a",
        }}
      >
        <div style={{ textAlign: "center", padding: "0 24px", maxWidth: 480 }}>
          <h1 style={{ fontSize: 24 }}>Something went wrong</h1>
          <p style={{ color: "#475569" }}>
            The app hit an error. It has been reported to the administrator, who can ask the coding
            agent to fix it.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 24,
              border: 0,
              borderRadius: 12,
              background: "#0f172a",
              color: "#fff",
              fontWeight: 700,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
