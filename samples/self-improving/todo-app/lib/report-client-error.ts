// Sends a client-side error to the backlog intake. Best-effort and never throws
// (an error reporter must not itself break the page). keepalive lets the request
// survive a navigation/unload.
export function reportClientError(message: string): void {
  try {
    void fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message,
        url: typeof location !== "undefined" ? location.pathname : "",
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }
}
