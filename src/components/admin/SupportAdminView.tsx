"use client";

import { useEffect, useState } from "react";

type ThreadListItem = {
  id: string;
  status: "OPEN" | "CLOSED";
  updatedAt: string;
  user: { email: string; company?: { name: string } | null; recruiterProfile?: { name: string } | null };
  messages: { text: string; fromAdmin: boolean; createdAt: string }[];
  _count: { messages: number };
};

type Message = {
  id: string;
  text: string;
  fromAdmin: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  return `${Math.floor(hrs / 24)} дн назад`;
}

export default function SupportAdminView() {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<any | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState(false);

  const loadList = async () => {
    const res = await fetch("/api/admin/support");
    if (res.ok) setThreads(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    loadList();
    const id = setInterval(loadList, 15000);
    return () => clearInterval(id);
  }, []);

  const openThread = async (id: string) => {
    setSelectedId(id);
    const res = await fetch(`/api/admin/support/${id}`);
    if (res.ok) {
      const data = await res.json();
      setThread(data);
      setMessages(data.messages);
      loadList(); // обновить счётчик непрочитанных в списке
    }
  };

  const send = async () => {
    if (!text.trim() || !selectedId) return;
    setSending(true);
    const res = await fetch(`/api/admin/support/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setSending(false);
    if (res.ok) {
      const created = await res.json();
      setMessages((prev) => [...prev, created]);
      setText("");
      loadList();
    }
  };

  const toggleStatus = async () => {
    if (!selectedId || !thread) return;
    setBusy(true);
    const nextStatus = thread.status === "OPEN" ? "CLOSED" : "OPEN";
    const res = await fetch(`/api/admin/support/${selectedId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    if (res.ok) {
      setThread((prev: any) => ({ ...prev, status: nextStatus }));
      loadList();
    }
  };

  const displayName = (u: ThreadListItem["user"]) => u.company?.name || u.recruiterProfile?.name || u.email;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px minmax(0, 1fr)", gap: 16, alignItems: "start" }}>
      <div className="card" style={{ overflow: "hidden" }}>
        {loading && <div className="mini muted" style={{ padding: 16 }}>Загрузка…</div>}
        {!loading && threads.length === 0 && (
          <div className="mini muted" style={{ padding: 16 }}>Обращений пока нет.</div>
        )}
        {threads.map((t) => {
          const last = t.messages[0];
          const unreadCount = t._count.messages;
          return (
            <div
              key={t.id}
              onClick={() => openThread(t.id)}
              style={{
                padding: "10px 14px", borderBottom: "1px solid var(--line)", cursor: "pointer",
                background: selectedId === t.id ? "var(--warm)" : unreadCount > 0 ? "var(--okbg)" : "transparent",
              }}
            >
              <div className="flex gap8" style={{ alignItems: "center" }}>
                <b className="mini" style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName(t.user)}
                </b>
                {unreadCount > 0 && (
                  <span className="pill pill-red" style={{ fontSize: 10 }}>{unreadCount}</span>
                )}
                {t.status === "CLOSED" && <span className="pill pill-mut" style={{ fontSize: 10 }}>Закрыт</span>}
              </div>
              {last && (
                <div className="mini muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                  {last.fromAdmin ? "Вы: " : ""}{last.text}
                </div>
              )}
              <div className="mini muted" style={{ fontSize: 10.5, marginTop: 2 }}>{timeAgo(t.updatedAt)}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ display: "flex", flexDirection: "column", height: 560 }}>
        {!thread ? (
          <div className="mini muted" style={{ margin: "auto", padding: 20 }}>Выберите обращение слева</div>
        ) : (
          <>
            <div className="card-h" style={{ padding: "10px 14px" }}>
              <h3 style={{ fontSize: 14 }}>{displayName(thread.user)}</h3>
              <span className="mini muted" style={{ marginLeft: 8 }}>{thread.user.email}</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} disabled={busy} onClick={toggleStatus}>
                {thread.status === "OPEN" ? "Закрыть обращение" : "Переоткрыть"}
              </button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {messages.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.fromAdmin ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  <div
                    className="mini"
                    style={{
                      maxWidth: "70%", padding: "8px 12px", borderRadius: 10,
                      background: m.fromAdmin ? "var(--dark)" : "var(--warm)",
                      color: m.fromAdmin ? "#fff" : "inherit",
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap8" style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
              <input
                className="inp"
                style={{ flex: 1 }}
                placeholder="Ответить пользователю…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !sending) send(); }}
              />
              <button className="btn btn-red btn-sm" disabled={sending || !text.trim()} onClick={send}>
                Отправить
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
