"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

// Mounted app-wide: forwards uncaught client errors and unhandled promise
// rejections to the backlog so the admin can have the agent fix them.
export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError(event.message || "Unknown client error");
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportClientError(
        "Unhandled rejection: " + (reason instanceof Error ? reason.message : String(reason)),
      );
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
