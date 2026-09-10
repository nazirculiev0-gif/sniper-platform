"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  const days = Math.floor(hrs / 24);
  return `${days} дн назад`;
}

const POLL_MS = 20000;

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const load = async () => {
    const res = await fetch("/api/notifications");
    if (!res.ok) return;
    const data = await res.json();
    setItems(data.notifications);
    setUnreadCount(data.unreadCount);
  };

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const toggleOpen = () => {
    setOpen((v) => !v);
  };

  const openItem = async (n: Notification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnreadCount((c) => Math.max(0, c - 1));
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" });
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const markAllRead = async () => {
    setLoading(true);
    await fetch("/api/notifications/read-all", { method: "POST" });
    setLoading(false);
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnreadCount(0);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        aria-label="Уведомления"
        style={{
          position: "relative", background: "none", border: "none", cursor: "pointer",
          width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 8, color: "inherit",
        }}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span
            style={{
              position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, padding: "0 3px",
              borderRadius: 99, background: "var(--red)", color: "#fff", fontSize: 10, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {mounted && open && createPortal(
        <div
          ref={panelRef}
          className="card"
          style={{
            position: "fixed", top: 16, right: 16, width: 340, maxWidth: "calc(100vw - 16px)",
            maxHeight: 420, overflowY: "auto", zIndex: 1000, boxShadow: "0 12px 32px rgba(0,0,0,.22)",
          }}
        >
          <div className="card-h" style={{ padding: "10px 14px" }}>
            <h3 style={{ fontSize: 13 }}>Уведомления</h3>
            {unreadCount > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} disabled={loading} onClick={markAllRead}>
                Прочитать все
              </button>
            )}
          </div>
          {items.length === 0 && (
            <div className="mini muted" style={{ padding: 16 }}>Уведомлений пока нет.</div>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => openItem(n)}
              style={{
                padding: "10px 14px", borderTop: "1px solid var(--line)", cursor: n.link ? "pointer" : "default",
                background: n.read ? "transparent" : "var(--warm)",
              }}
            >
              <div className="flex gap8" style={{ alignItems: "flex-start" }}>
                {!n.read && <span style={{ width: 7, height: 7, borderRadius: 99, background: "var(--red)", marginTop: 5, flexShrink: 0 }} />}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="mini" style={{ display: "block" }}>{n.title}</b>
                  {n.body && <div className="mini muted" style={{ marginTop: 2 }}>{n.body}</div>}
                  <div className="mini muted" style={{ marginTop: 4, fontSize: 10.5 }}>{timeAgo(n.createdAt)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
