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
          { role: "bot", text: "Sorry — " + (data.error || "something went wrong.") },
        ]);
      } else {
        setMessages((m) => [
          ...m,
          { role: "bot", text: data.answer, sources: data.sources },
        ]);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "bot", text: "Network error — please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const suggestions = [
    "What's our policy on this?",
    "Summarize the key rules",
    "How do I get started?",
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4">
      <div className="flex-1 space-y-4 py-6">
        {messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-md text-center rise">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-sage-100 text-3xl">
              💬
            </div>
            <h2 className="mt-4 font-display text-2xl font-semibold text-ink">
              Ask {botName} anything
            </h2>
            <p className="mt-1.5 text-sm text-ink-soft">
              Answers come straight from your team&apos;s documents, with sources.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink-soft transition hover:border-sage-500 hover:text-sage-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                m.role === "user"
                  ? "max-w-[82%] rounded-2xl rounded-br-md bg-sage-600 px-4 py-2.5 text-sm text-white shadow-sm"
                  : "max-w-[82%] rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-2.5 text-sm text-ink shadow-sm"
              }
            >
              <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
              {m.sources && m.sources.length > 0 && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5 border-t border-line pt-2">
                  <span className="text-[11px] font-medium text-ink-soft">Sources:</span>
                  {m.sources.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-line bg-surface px-4 py-3 shadow-sm">
              <Dot delay="0ms" />
              <Dot delay="150ms" />
              <Dot delay="300ms" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form onSubmit={send} className="sticky bottom-0 bg-gradient-to-t from-cream via-cream to-transparent pb-5 pt-3">
        <div className="flex items-center gap-2 rounded-full border border-line bg-surface p-1.5 shadow-sm focus-within:border-sage-500 focus-within:shadow-[0_0_0_3px_rgba(111,143,98,0.16)]">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Message ${botName}…`}
            className="flex-1 bg-transparent px-3 py-1.5 text-sm text-ink placeholder:text-[#b6ac98] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary px-5"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="inline-block h-2 w-2 animate-bounce rounded-full bg-sage-500"
      style={{ animationDelay: delay }}
    />
  );
}
