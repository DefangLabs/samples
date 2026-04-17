export type SeedRun = {
  id: string;
  status: string;
  totalItems: number;
  processedItems: number;
  summary: string | null;
  error: string | null;
  updatedAt: string;
};

export type DashboardResponse = {
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

export type Item = {
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

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  trace?: ChatTraceEvent[];
  state?: "streaming" | "complete" | "error";
};

export type ChatTraceEvent =
  | { id: string; type: "thinking"; text: string }
  | { id: string; type: "tool_call"; toolName: string; args: unknown }
  | { id: string; type: "tool_result"; toolName: string; summary: string };

export type ChatStreamEvent =
  | { type: "meta"; threadId: string }
  | { type: "delta"; text: string }
  | { type: "thinking"; text: string }
  | { type: "tool_call"; toolName: string; args: unknown }
  | { type: "tool_result"; toolName: string; summary: string }
  | { type: "done" }
  | { type: "error"; message: string };
