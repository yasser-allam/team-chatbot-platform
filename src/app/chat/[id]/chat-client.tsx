"use client";

import { useState, useRef, useEffect } from "react";

type Msg = { role: "user" | "bot"; text: string; sources?: string[] };

export function ChatClient({
  chatbotId,
  botName,
}: {
  chatbotId: string;
  botName: string;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatbotId, message: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "bot", text: "Error: " + (data.error || "Something went wrong.") },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "bot", text: data.answer, sources: data.sources },
        ]);
      }
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Network error." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
      <div className="flex-1 space-y-4 py-6">
        {messages.length === 0 && (
          <p className="mt-10 text-center text-sm text-gray-400">
            Ask {botName} a question about your team&apos;s policies.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[80%] rounded-2xl bg-gray-900 px-4 py-2 text-sm text-white"
                  : "max-w-[80%] rounded-2xl bg-white px-4 py-2 text-sm text-gray-900 shadow-sm"
              }
            >
              <p className="whitespace-pre-wrap">{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <p className="mt-2 text-xs text-gray-400">
                  Based on: {m.sources.join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-white px-4 py-2 text-sm text-gray-400 shadow-sm">
              Thinking…
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 bg-gray-50 py-4">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question…"
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:border-gray-900 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-gray-900 px-5 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
