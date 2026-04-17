import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChatMessage as ChatMessageType, ChatTraceEvent } from "@/app/types";
import { formatToolArgs } from "@/app/formatting";

function TraceStack({ trace }: { trace: ChatTraceEvent[] }) {
  return (
    <div className="trace-stack" aria-label="Agent tool trace">
      {trace.map((traceEvent) => {
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
  );
}

export function ChatMessageView({ message }: { message: ChatMessageType }) {
  if (message.role === "user") {
    return (
      <div className={`chat-message user ${message.state ?? "complete"}`}>
        {message.content}
      </div>
    );
  }

  return (
    <div className={`chat-message assistant ${message.state ?? "complete"}`}>
      <div className="chat-markdown">
        {message.trace && message.trace.length > 0 ? <TraceStack trace={message.trace} /> : null}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content || "Working..."}</ReactMarkdown>
        {message.state === "streaming" ? <span className="stream-cursor" aria-hidden="true" /> : null}
      </div>
    </div>
  );
}
