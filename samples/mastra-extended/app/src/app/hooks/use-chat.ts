/**
 * Chat state hook. Sends user messages to POST /api/chat and reads the
 * streamed NDJSON response, updating message state as text deltas, tool
 * traces, and completion events arrive.
 */

"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

import type { ChatMessage, ChatStreamEvent, ChatTraceEvent } from "@/app/types";
import { generateMessageId } from "@/app/formatting";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState("What should I look at first?");
  const [threadId, setThreadId] = useState<string | undefined>();
  const [sending, setSending] = useState(false);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!chatLogRef.current) return;
    chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
  }, [messages]);

  function appendTrace(messageId: string, traceEvent: ChatTraceEvent) {
    setMessages((prev) =>
      prev.map((message) => {
        if (message.id !== messageId) return message;

        const trace = message.trace ?? [];
        const lastTrace = trace[trace.length - 1];

        if (traceEvent.type === "thinking" && lastTrace?.type === "thinking") {
          return {
            ...message,
            trace: [...trace.slice(0, -1), { ...lastTrace, text: lastTrace.text + traceEvent.text }],
          };
        }

        return { ...message, trace: [...trace, traceEvent] };
      }),
    );
  }

  function applyStreamEvent(messageId: string, streamEvent: ChatStreamEvent) {
    if (streamEvent.type === "meta") {
      setThreadId(streamEvent.threadId);
      return;
    }

    if (streamEvent.type === "delta") {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, state: "streaming", content: message.content + streamEvent.text }
            : message,
        ),
      );
      return;
    }

    if (streamEvent.type === "thinking") {
      appendTrace(messageId, { id: generateMessageId(), type: "thinking", text: streamEvent.text });
      return;
    }

    if (streamEvent.type === "tool_call") {
      appendTrace(messageId, {
        id: generateMessageId(),
        type: "tool_call",
        toolName: streamEvent.toolName,
        args: streamEvent.args,
      });
      return;
    }

    if (streamEvent.type === "tool_result") {
      appendTrace(messageId, {
        id: generateMessageId(),
        type: "tool_result",
        toolName: streamEvent.toolName,
        summary: streamEvent.summary,
      });
      return;
    }

    if (streamEvent.type === "done") {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, state: "complete", content: message.content || "No response text returned." }
            : message,
        ),
      );
      return;
    }

    if (streamEvent.type === "error") {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === messageId
            ? { ...message, state: "error", content: message.content || streamEvent.message }
            : message,
        ),
      );
    }
  }

  async function readStreamInto(messageId: string, reader: ReadableStreamDefaultReader<Uint8Array>) {
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let newlineIndex = buffer.indexOf("\n");

      while (newlineIndex >= 0) {
        const rawEvent = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (rawEvent) {
          applyStreamEvent(messageId, JSON.parse(rawEvent) as ChatStreamEvent);
        }

        newlineIndex = buffer.indexOf("\n");
      }
    }

    const trailing = buffer.trim();
    if (trailing) {
      applyStreamEvent(messageId, JSON.parse(trailing) as ChatStreamEvent);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!prompt.trim()) return;

    const currentPrompt = prompt.trim();
    setPrompt("");
    setSending(true);
    const assistantMessageId = generateMessageId();

    setMessages((prev) => [
      ...prev,
      { id: generateMessageId(), role: "user", content: currentPrompt, state: "complete" },
      { id: assistantMessageId, role: "assistant", content: "", state: "streaming" },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/x-ndjson" },
        body: JSON.stringify({ message: currentPrompt, threadId, stream: true }),
      });

      if (!response.ok) throw new Error("Copilot response failed");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Streaming response unavailable");

      await readStreamInto(assistantMessageId, reader);
    } catch {
      setMessages((prev) =>
        prev.map((message) =>
          message.id === assistantMessageId
            ? { ...message, state: "error", content: "The copilot could not answer that right now." }
            : message,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  return { messages, prompt, setPrompt, chatLogRef, sending, handleSubmit };
}
