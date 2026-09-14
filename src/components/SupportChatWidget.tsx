"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MessageCircle, X } from "lucide-react";

type Message = {
  id: string;
  text: string;
  fromAdmin: boolean;
  createdAt: string;
};

const POLL_MS = 8000;

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const seenAdminIds = useRef<Set<string>>(new Set());

  useEffect(() => setMounted(true), []);

  const load = async () => {
    const res = await fetch("/api/support");
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages);
    if (!open) {
      const newAdminUnseen = data.messages.filter(
        (m: Message) => m.fromAdmin && !seenAdminIds.current.has(m.id)
      );
      if (newAdminUnseen.length > 0) setUnread((u) => u + newAdminUnseen.length);
    }
    data.messages.forEach((m: Message) => seenAdminIds.current.add(m.id));
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (open) {
      setUnread(0);
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [open, messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setSending(false);
    if (res.ok) {
      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      seenAdminIds.current.add(created.id);
      setText("");
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 1000 }}>
      {open && (
        <div
          className="card"
          style={{
            position: "absolute", bottom: 56, right: 0, width: 320, height: 420,
            display: "flex", flexDirection: "column", boxShadow: "0 12px 32px rgba(0,0,0,.22)",
          }}
        >
          <div className="card-h" style={{ padding: "10px 14px" }}>
            <h3 style={{ fontSize: 13 }}>Поддержка SNIPER</h3>
            <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setOpen(false)}>×</button>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: "auto", padding: "10px 12px" }}>
            {messages.length === 0 && (
              <div className="mini muted" style={{ padding: 8 }}>
                Опишите вопрос — команда SNIPER ответит здесь в ближайшее время.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex", justifyContent: m.fromAdmin ? "flex-start" : "flex-end", marginBottom: 8,
                }}
              >
                <div
                  className="mini"
                  style={{
                    maxWidth: "80%", padding: "8px 10px", borderRadius: 10,
                    background: m.fromAdmin ? "var(--warm)" : "var(--dark)",
                    color: m.fromAdmin ? "inherit" : "#fff",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap8" style={{ padding: 10, borderTop: "1px solid var(--line)" }}>
            <input
              className="inp"
              style={{ flex: 1 }}
              placeholder="Напишите сообщение…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !sending) send(); }}
            />
            <button className="btn btn-red btn-sm" disabled={sending || !text.trim()} onClick={send}>
              →
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Чат поддержки"
        style={{
          position: "relative", width: 48, height: 48, borderRadius: "50%", border: "none", cursor: "pointer",
          background: "var(--red)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,.2)",
        }}
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
        {!open && unread > 0 && (
          <span
            style={{
              position: "absolute", top: -2, right: -2, minWidth: 18, height: 18, padding: "0 4px",
              borderRadius: 99, background: "#fff", color: "var(--red)", fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid var(--red)",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>,
    document.body
  );
}
