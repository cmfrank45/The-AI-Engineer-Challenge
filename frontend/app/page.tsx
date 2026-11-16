"use client";

/**
 * The whole app: a single chat screen.
 *
 * - Header shows a live backend status pill (polls GET /api/health).
 * - Message list shows the conversation; it auto-scrolls to the newest message.
 * - Composer is an auto-growing textarea. Enter sends, Shift+Enter adds a newline.
 *
 * The backend is stateless (it receives one message at a time), so the
 * conversation history lives only in this component's state.
 */

import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { API_BASE_URL, checkHealth, sendChatMessage } from "@/lib/api";
import styles from "./page.module.css";

type Role = "user" | "assistant" | "error";

interface Message {
  id: number;
  role: Role;
  content: string;
}

type HealthStatus = "checking" | "online" | "offline";

/** How often to re-check backend health, in milliseconds. */
const HEALTH_POLL_MS = 15_000;

const STATUS_LABEL: Record<HealthStatus, string> = {
  checking: "Checking backend…",
  online: "Backend connected",
  offline: "Backend offline",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [health, setHealth] = useState<HealthStatus>("checking");

  const nextId = useRef(0);
  const listEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Poll the health endpoint on load, on an interval, and when the tab regains focus.
  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const ok = await checkHealth();
      if (!cancelled) setHealth(ok ? "online" : "offline");
    };

    refresh();
    const interval = setInterval(refresh, HEALTH_POLL_MS);
    window.addEventListener("focus", refresh);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  // Keep the newest message in view.
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isSending]);

  // Grow the textarea with its content (capped by max-height in CSS).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [input]);

  const addMessage = (role: Role, content: string) => {
    const message = { id: nextId.current++, role, content };
    setMessages((prev) => [...prev, message]);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isSending) return;

    addMessage("user", text);
    setInput("");
    setIsSending(true);

    try {
      const reply = await sendChatMessage(text);
      addMessage("assistant", reply);
      setHealth("online"); // a successful chat proves the backend is up
    } catch (error) {
      addMessage(
        "error",
        error instanceof Error ? error.message : "Something went wrong.",
      );
      // Re-check health so the pill reflects reality after a failure.
      setHealth((await checkHealth()) ? "online" : "offline");
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    send();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends; Shift+Enter inserts a newline. Ignore Enter while an IME is composing.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send();
    }
  };

  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Mental Coach</h1>
          <p className={styles.subtitle}>A supportive space to talk things through.</p>
        </div>
        <div
          className={`${styles.status} ${styles[health]}`}
          role="status"
          aria-live="polite"
          title={`API: ${API_BASE_URL || "same origin"}`}
        >
          <span className={styles.dot} aria-hidden="true" />
          {STATUS_LABEL[health]}
        </div>
      </header>

      <main className={styles.messages} aria-label="Conversation">
        {messages.length === 0 && (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>How are you feeling today?</p>
            <p>Share what&apos;s on your mind — stress, motivation, habits, confidence.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`${styles.row} ${styles[`row_${message.role}`]}`}>
            <div className={`${styles.bubble} ${styles[message.role]}`}>{message.content}</div>
          </div>
        ))}

        {isSending && (
          <div className={`${styles.row} ${styles.row_assistant}`}>
            <div className={`${styles.bubble} ${styles.assistant} ${styles.typing}`} aria-label="Coach is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={listEndRef} />
      </main>

      <form className={styles.composer} onSubmit={handleSubmit}>
        <textarea
          ref={textareaRef}
          className={styles.input}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…  (Shift+Enter for a new line)"
          rows={1}
          aria-label="Message"
          autoFocus
        />
        <button className={styles.send} type="submit" disabled={!input.trim() || isSending}>
          {isSending ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
