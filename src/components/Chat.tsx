"use client";

import { useEffect, useRef, useState } from "react";
import VideoCallModal from "@/components/VideoCallModal";

type ChatProps = {
  requestId: string;
  role: string;
  // для работодателя — список рекрутеров-участников, чтобы выбрать тред
  participants?: { recruiterId: string; recruiter: { name: string } }[];
  companyName?: string;
};

export default function Chat({ requestId, role, participants, companyName }: ChatProps) {
  const [selRecruiter, setSelRecruiter] = useState(participants?.[0]?.recruiterId ?? "");
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [calling, setCalling] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const activeRecruiterId = role === "EMPLOYER" ? selRecruiter : undefined;

  const load = async () => {
    const qs = activeRecruiterId ? `?recruiterId=${activeRecruiterId}` : "";
    const res = await fetch(`/api/requests/${requestId}/messages${qs}`);
    if (res.ok) setMessages(await res.json());
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 4000); // простой поллинг вместо WebSocket — для демо этого достаточно
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRecruiterId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const body: any = { text: text.trim() };
    if (role === "EMPLOYER") body.recruiterId = selRecruiter;
    const res = await fetch(`/api/requests/${requestId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    if (res.ok) {
      setText("");
      load();
    }
  };

  const endCall = async (seconds: number) => {
    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    const body: any = { text: `📹 Видеозвонок завершён · ${mm}:${ss}` };
    if (role === "EMPLOYER") body.recruiterId = selRecruiter;
    await fetch(`/api/requests/${requestId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  };

  if (role === "EMPLOYER" && !participants?.length) {
    return <div className="card card-p mini muted">Чат появится, как только рекрутер возьмёт заявку в работу.</div>;
  }

  return (
    <div className="card">
      <div className="card-h" style={{ gap: 10 }}>
        {role === "EMPLOYER" && participants && participants.length > 1 ? (
          <select
            className="inp"
            style={{ maxWidth: 220 }}
            value={selRecruiter}
            onChange={(e) => setSelRecruiter(e.target.value)}
          >
            {participants.map((p) => (
              <option key={p.recruiterId} value={p.recruiterId}>{p.recruiter.name}</option>
            ))}
          </select>
        ) : (
          <h3 style={{ fontSize: 14 }}>
            Чат с {role === "EMPLOYER" ? participants?.[0]?.recruiter.name : companyName || "работодателем"}
          </h3>
        )}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={() => setCalling(true)}>
          📹 Видеозвонок
        </button>
      </div>
      <div ref={boxRef} style={{ maxHeight: 340, minHeight: 160, overflowY: "auto", padding: 14, display: "grid", gap: 8 }}>
        {messages.length === 0 && <div className="mini muted">Сообщений пока нет — начните разговор.</div>}
        {messages.map((m) => {
          const mine = m.fromRole === role;
          return (
            <div
              key={m.id}
              style={{
                alignSelf: mine ? "flex-end" : "flex-start",
                maxWidth: "75%",
                background: mine ? "var(--red)" : "var(--warm)",
                color: mine ? "#fff" : "var(--ink)",
                borderRadius: 12,
                padding: "8px 12px",
                fontSize: 13,
              }}
            >
              {m.text}
              <div style={{ fontSize: 10, opacity: 0.7, marginTop: 3 }}>
                {new Date(m.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap8" style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
        <input
          className="inp"
          placeholder="Написать сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button className="btn btn-red btn-sm" disabled={loading} onClick={send}>Отправить</button>
      </div>
      {calling && (
        <VideoCallModal
          name={role === "EMPLOYER" ? (participants?.find((p) => p.recruiterId === selRecruiter)?.recruiter.name ?? "Собеседник") : (companyName || "Собеседник")}
          onClose={() => setCalling(false)}
          onEnd={endCall}
        />
      )}
    </div>
  );
}
