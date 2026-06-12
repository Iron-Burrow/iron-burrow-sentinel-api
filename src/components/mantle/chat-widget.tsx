"use client";

import { useEffect, useRef, useState } from "react";

import type { ChatTurn } from "@/lib/types";

type Message = {
  id: number;
  role: "user" | "bot";
  text: string;
  variant?: "error" | "pending";
};

const GREETING =
  'Hi! Ask me about any asset in the catalog — e.g. "tell me about mETH" or "which stablecoins are listed?"';

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const historyRef = useRef<ChatTurn[]>([]);
  const seededRef = useRef(false);
  const idRef = useRef(0);
  const logRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const nextId = () => {
    idRef.current += 1;
    return idRef.current;
  };

  // Auto-scroll the log to the newest message.
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages]);

  function openPanel() {
    setOpen(true);
    if (!seededRef.current) {
      seededRef.current = true;
      setMessages([{ id: nextId(), role: "bot", text: GREETING }]);
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || submitting) return;

    const pendingId = nextId();
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: "user", text: message },
      { id: pendingId, role: "bot", text: "Thinking...", variant: "pending" },
    ]);
    setInput("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message, history: historyRef.current }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        replacePending(pendingId, data.error || "Sorry, something went wrong.", "error");
      } else {
        replacePending(pendingId, data.answer);
        const next = [
          ...historyRef.current,
          { role: "user" as const, content: message },
          { role: "assistant" as const, content: data.answer },
        ];
        historyRef.current = next.length > 20 ? next.slice(-20) : next;
      }
    } catch {
      replacePending(pendingId, "Network error — try again.", "error");
    } finally {
      setSubmitting(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function replacePending(id: number, text: string, variant?: "error") {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text, variant } : m)),
    );
  }

  return (
    <div className="bs-chat" data-open={open ? "true" : "false"}>
      <button
        type="button"
        className="bs-chat-toggle"
        aria-label="Open chat assistant"
        aria-expanded={open}
        onClick={openPanel}
      >
        <span className="bs-chat-toggle-icon">💬</span>
        <span className="bs-chat-toggle-label">Ask Sentinel</span>
      </button>

      <section
        className="bs-chat-panel"
        role="dialog"
        aria-label="Sentinel assistant"
        aria-hidden={!open}
      >
        <header className="bs-chat-header">
          <div>
            <strong>Sentinel assistant</strong>
            <small>Ask about any of the 20 catalog assets</small>
          </div>
          <button
            type="button"
            className="bs-chat-close"
            aria-label="Close chat"
            onClick={() => setOpen(false)}
          >
            ×
          </button>
        </header>

        <div className="bs-chat-log" role="log" aria-live="polite" ref={logRef}>
          {messages.map((m) => (
            <div
              key={m.id}
              className={`bs-chat-msg bs-chat-msg-${m.role}${
                m.variant ? ` bs-chat-msg-${m.variant}` : ""
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form className="bs-chat-form" autoComplete="off" onSubmit={onSubmit}>
          <input
            ref={inputRef}
            type="text"
            name="message"
            maxLength={1000}
            placeholder="Ask about an asset..."
            aria-label="Chat message"
            required
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={submitting}>
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
