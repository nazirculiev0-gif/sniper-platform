"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STAGE_LABEL: Record<string, string> = {
  NEW: "Новые",
  SCREENING: "Скрининг",
  INTERVIEW: "Интервью",
  OFFER: "Оффер",
  OFFER_ACCEPTED: "Оффер принят",
  HIRED: "Нанят",
  REJECTED: "Отказ",
};

const SEARCH_STATUS_LABEL: Record<string, { t: string; c: string }> = {
  active: { t: "Активно ищет", c: "pill-ok" },
  passive: { t: "Пассивно смотрит", c: "pill-info" },
  employed: { t: "Трудоустроен", c: "pill-mut" },
};

const TABS = [
  { key: "profile", label: "Профиль" },
  { key: "resume", label: "Резюме / CV" },
  { key: "files", label: "Файлы" },
  { key: "chat", label: "Переписка" },
  { key: "interviews", label: "Собеседования" },
];

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU");
}

export default function CandidateDetailModal({
  candidate,
  canEdit,
  onClose,
  onUpdated,
}: {
  candidate: any;
  canEdit: boolean;
  onClose: () => void;
  onUpdated?: (updated: any) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("profile");
  const [note, setNote] = useState(candidate.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const searchStatus = candidate.searchStatus ? SEARCH_STATUS_LABEL[candidate.searchStatus] : null;

  const saveNote = async () => {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/candidates/${candidate.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    setSaving(false);
    if (res.ok) {
      const updated = await res.json();
      setSaved(true);
      onUpdated?.(updated);
      router.refresh();
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(20,24,30,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}
      onClick={onClose}
    >
      <div className="card" style={{ width: "min(640px, 100%)", maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div className="card-h">
          <h3 style={{ fontSize: 15 }}>{candidate.name}</h3>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto" }} onClick={onClose}>×</button>
        </div>

        <div style={{ padding: "16px 18px 0" }}>
          <div className="flex gap8" style={{ alignItems: "center", marginBottom: 14 }}>
            <div className="av" style={{ width: 44, height: 44, fontSize: 16, background: "var(--dark)" }}>
              {candidate.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="flex gap8" style={{ alignItems: "center" }}>
                <b className="sg" style={{ fontSize: 15 }}>{candidate.name}</b>
                {searchStatus && <span className={`pill ${searchStatus.c}`}>{searchStatus.t}</span>}
              </div>
              <div className="mini muted">{candidate.profession || "Профессия не указана"}</div>
            </div>
          </div>
        </div>

        <div className="flex gap8 wrapf" style={{ padding: "0 18px", borderBottom: "1px solid var(--line)" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{ background: "none", border: "none", borderBottom: tab === t.key ? "2px solid var(--red)" : "2px solid transparent", color: tab === t.key ? "var(--red)" : "var(--mid)", fontWeight: 600, fontSize: 12.5, padding: "8px 4px", marginRight: 14, cursor: "pointer" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ padding: 18 }}>
          {tab === "profile" && (
            <div>
              <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Профессия</span>
                  <b className="mini">{candidate.profession || "—"}</b>
                </div>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Ожидаемая ЗП</span>
                  <b className="mini">{fmtSum(candidate.expSalary)}</b>
                </div>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Источник</span>
                  <b className="mini">{candidate.source || "—"}</b>
                </div>
                <div className="flex" style={{ justifyContent: "space-between" }}>
                  <span className="mini muted">Добавлен</span>
                  <b className="mini">{fmtDate(candidate.createdAt)}</b>
                </div>
                {candidate.recruiter?.name && (
                  <div className="flex" style={{ justifyContent: "space-between" }}>
                    <span className="mini muted">Рекрутер</span>
                    <b className="mini">{candidate.recruiter.name}</b>
                  </div>
                )}
              </div>

              {candidate.skills?.length > 0 && (
                <>
                  <div className="mini muted" style={{ marginBottom: 6 }}>Навыки</div>
                  <div className="flex gap8 wrapf" style={{ marginBottom: 16 }}>
                    {candidate.skills.map((s: string) => <span key={s} className="tag">{s}</span>)}
                  </div>
                </>
              )}

              <div className="card card-p" style={{ background: "var(--okbg)", borderColor: "transparent", marginBottom: 16 }}>
                <span className="mini">По текущей заявке: этап <b>{STAGE_LABEL[candidate.stage] || candidate.stage}</b></span>
              </div>

              <label className="fld">
                <span>Заметки</span>
                <textarea
                  className="inp"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  readOnly={!canEdit}
                  placeholder={canEdit ? "Впечатления от разговора, договорённости…" : "Заметок пока нет"}
                  style={{ minHeight: 80 }}
                />
              </label>
              {canEdit && (
                <div className="flex gap8" style={{ alignItems: "center" }}>
                  <button className="btn btn-red btn-sm" disabled={saving} onClick={saveNote}>
                    {saving ? "Сохраняем…" : "Сохранить заметку"}
                  </button>
                  {saved && <span className="mini" style={{ color: "var(--ok)" }}>Сохранено</span>}
                </div>
              )}
            </div>
          )}

          {tab === "resume" && (
            <div className="mini muted">
              {candidate.source === "Резюме (файл)"
                ? "Кандидат добавлен из загруженного резюме — файл был распознан в демо-режиме. Хранение и просмотр оригинального файла в этой версии платформы не реализовано."
                : "Кандидат добавлен вручную — резюме не прикреплено."}
            </div>
          )}

          {tab === "files" && (
            <div className="mini muted">Загрузка файлов по кандидату пока не реализована.</div>
          )}

          {tab === "chat" && (
            <div className="mini muted">Переписка ведётся в общем чате заявки — откройте вкладку «Чат» на странице заявки.</div>
          )}

          {tab === "interviews" && (
            <div className="mini muted">Планирование собеседований пока не реализовано. Договориться о звонке можно в чате заявки.</div>
          )}
        </div>
      </div>
    </div>
  );
}
