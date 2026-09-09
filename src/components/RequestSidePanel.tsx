"use client";

import { useState, type ReactNode } from "react";

export default function RequestTabs({
  overview,
  questions,
  questionsCount,
  candidates,
  candidatesCount,
  chat,
  showChat,
}: {
  overview: ReactNode;
  questions: ReactNode;
  questionsCount: number;
  candidates: ReactNode;
  candidatesCount: number;
  chat: ReactNode;
  showChat: boolean;
}) {
  const [tab, setTab] = useState<"overview" | "questions" | "candidates" | "chat">("overview");

  const tabs: { key: typeof tab; label: string }[] = [
    { key: "overview", label: "Обзор" },
    { key: "questions", label: `Вопросы${questionsCount ? ` ${questionsCount}` : ""}` },
    { key: "candidates", label: `Кандидаты ${candidatesCount}` },
    ...(showChat ? [{ key: "chat" as const, label: "Чат" }] : []),
  ];

  return (
    <div>
      <div className="flex gap8" style={{ borderBottom: "1px solid var(--line)", marginBottom: 18 }}>
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.key ? "2px solid var(--red)" : "2px solid transparent",
              color: tab === t.key ? "var(--red)" : "var(--mid)",
              fontWeight: tab === t.key ? 600 : 500,
              fontSize: 13.5,
              padding: "10px 4px",
              marginRight: 18,
              cursor: "pointer",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "overview" && overview}
      {tab === "questions" && questions}
      {tab === "candidates" && candidates}
      {tab === "chat" && showChat && chat}
    </div>
  );
}
