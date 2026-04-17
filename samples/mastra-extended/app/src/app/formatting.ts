export function generateMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatTimestamp(value: string | null | undefined) {
  if (!value) return "Not started yet";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatPriority(priority: string | null) {
  if (!priority) return "pending";
  return priority;
}

export function priorityClass(priority: string | null) {
  const normalized = priority?.toLowerCase() ?? "";
  if (normalized === "critical") return "status-critical";
  if (normalized === "high") return "status-high";
  if (normalized === "medium") return "status-medium";
  return "status-low";
}

export function formatToolArgs(args: unknown) {
  if (!args || typeof args !== "object") {
    return "no filters";
  }

  const entries = Object.entries(args).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (entries.length === 0) return "no filters";

  return entries
    .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
    .join(", ");
}
