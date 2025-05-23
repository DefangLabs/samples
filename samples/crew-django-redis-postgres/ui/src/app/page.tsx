"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export default function Home() {
  // WebSocket state
  // Build WebSocket URL from NEXT_PUBLIC_API_URL
  let wsUrl = "ws://localhost:8000/ws/echo/";
  if (process.env.NEXT_PUBLIC_API_URL) {
    try {
      const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL);
      const wsProtocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${wsProtocol}//${apiUrl.hostname}${apiUrl.port ? `:${apiUrl.port}` : ""}/ws/echo/`;
    } catch {
      // fallback to default
    }
  }
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ data: string, timestamp: string }[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Helper to establish WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (ws.current && (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
      // Already connected or connecting
      return;
    }
    ws.current = new window.WebSocket(wsUrl);
    ws.current.onopen = () => setConnected(true);
    ws.current.onclose = () => setConnected(false);
    ws.current.onerror = () => setError("WebSocket error");
    ws.current.onmessage = (e) => {
      setMessages(prev => [
        ...prev,
        {
          data: e.data,
          timestamp: new Date().toISOString(),
        },
      ]);
    };
  }, [wsUrl]);

  useEffect(() => {
    connectWebSocket();
    const handleFocus = () => {
      // Only reconnect if websocket is not open or connecting
      if (!ws.current || (ws.current.readyState !== WebSocket.OPEN && ws.current.readyState !== WebSocket.CONNECTING)) {
        connectWebSocket();
      }
    };
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      ws.current?.close();
    };
    // Only run on mount/unmount
  }, [wsUrl, connectWebSocket]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (ws.current && connected) {
      ws.current.send(JSON.stringify({ text: input }));
      setInput("");
    }
  }

  return (
    <div className="flex flex-col gap-4 items-center min-h-screen min-w-screen justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-md flex flex-col gap-2 border border-gray-200 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-black/40 mt-4">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message to send over WebSocket"
            className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring focus:border-blue-400 dark:bg-black/60 dark:text-white"
            aria-label="WebSocket Message"
            disabled={!connected}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
            disabled={!connected || !input.trim()}
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
          Status: {connected ? "Connected" : "Disconnected"}
          {error && <span className="ml-2 text-red-500">{error}</span>}
        </div>
        {messages.length > 0 && (
          <div className="mt-2 max-h-64 overflow-y-auto p-2 bg-gray-100 dark:bg-gray-800 rounded text-sm">
            <strong className="block mb-2">Messages from backend:</strong>
            <ul className="space-y-2">
              {[...messages].reverse().map((msg, idx) => {
                let pretty;
                try {
                  pretty = JSON.stringify(JSON.parse(msg.data), null, 2);
                } catch {
                  pretty = msg.data;
                }
                return (
                  <li key={idx} className="border-b border-gray-300 dark:border-gray-700 pb-2 last:border-b-0">
                    <div className="text-xs text-gray-500 mb-1">{new Date(msg.timestamp).toLocaleString()}</div>
                    <pre className="whitespace-pre-wrap break-words bg-gray-200 dark:bg-gray-900 rounded p-2">{pretty}</pre>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </form>
    </div>
  );
}
