"use client";

import { useEffect, useState } from "react";

export default function QATab({ requestId, role }: { requestId: string; role: string }) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch(`/api/requests/${requestId}/questions`);
    if (res.ok) setQuestions(await res.json());
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async () => {
    if (!text.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/requests/${requestId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text.trim() }),
    });
    setLoading(false);
    if (res.ok) {
      setText("");
      load();
    }
  };

  return (
    <div className="card">
      <div className="card-h">
        <h3 style={{ fontSize: 14 }}>Вопросы по вакансии</h3>
        <div className="sub">Публичны для всех на бирже — работодатель отвечает здесь</div>
      </div>
      <div style={{ padding: 14, display: "grid", gap: 10, maxHeight: 300, overflowY: "auto" }}>
        {questions.length === 0 && <div className="mini muted">Вопросов пока нет.</div>}
        {questions.map((q) => (
          <div key={q.id} className="flex gap8" style={{ alignItems: "flex-start" }}>
            <span className={`pill ${q.fromRole === "EMPLOYER" ? "pill-ok" : "pill-info"}`} style={{ flexShrink: 0 }}>
              {q.fromRole === "EMPLOYER" ? "Работодатель" : "Рекрутер"}
            </span>
            <div className="mini" style={{ flex: 1 }}>{q.text}</div>
          </div>
        ))}
      </div>
      <div className="flex gap8" style={{ padding: 12, borderTop: "1px solid var(--line)" }}>
        <input
          className="inp"
          placeholder={role === "EMPLOYER" ? "Ответить или уточнить…" : "Задать вопрос по заявке…"}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
        />
        <button className="btn btn-red btn-sm" disabled={loading} onClick={send}>
          {role === "EMPLOYER" ? "Ответить" : "Спросить"}
        </button>
      </div>
    </div>
  );
}
