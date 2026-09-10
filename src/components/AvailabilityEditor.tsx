"use client";

import { useEffect, useState } from "react";

const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

type Slot = {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

export default function AvailabilityEditor() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    fetch("/api/company-profile/availability")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setSlots(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const addSlot = async () => {
    setError("");
    setSaving(true);
    const res = await fetch("/api/company-profile/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayOfWeek, startTime, endTime }),
    });
    setSaving(false);
    if (res.ok) {
      const created = await res.json();
      setSlots((prev) => [...prev, created].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime)));
    } else {
      const data = await res.json();
      setError(typeof data.error === "string" ? data.error : "Не удалось добавить слот");
    }
  };

  const removeSlot = async (id: string) => {
    setSlots((prev) => prev.filter((s) => s.id !== id));
    const res = await fetch(`/api/company-profile/availability/${id}`, { method: "DELETE" });
    if (!res.ok) load(); // откатываем, если не удалилось
  };

  return (
    <div className="card card-p" style={{ maxWidth: 560, marginTop: 18 }}>
      <div className="sectit" style={{ fontSize: 14, marginBottom: 4 }}>Доступность для собеседований</div>
      <div className="hint" style={{ marginBottom: 14 }}>
        Повторяющиеся по неделям слоты, когда вам удобно проводить собеседования. Рекрутеры увидят их при планировании — так время предлагают осмысленно, а не наугад.
      </div>

      {loading && <div className="mini muted">Загрузка…</div>}

      {!loading && slots.length === 0 && (
        <div className="mini muted" style={{ marginBottom: 12 }}>Слоты ещё не добавлены — рекрутеры пока не видят вашу доступность.</div>
      )}

      {!loading && slots.length > 0 && (
        <div style={{ display: "grid", gap: 6, marginBottom: 14 }}>
          {slots.map((s) => (
            <div key={s.id} className="flex gap8" style={{ alignItems: "center" }}>
              <span className="tag">{DAY_LABELS[s.dayOfWeek]}</span>
              <span className="mini">{s.startTime}–{s.endTime}</span>
              <button className="btn btn-ghost btn-sm" style={{ marginLeft: "auto", color: "var(--red)" }} onClick={() => removeSlot(s.id)}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap8 wrapf" style={{ alignItems: "flex-end" }}>
        <label className="fld" style={{ marginBottom: 0 }}>
          <span>День</span>
          <select className="inp" value={dayOfWeek} onChange={(e) => setDayOfWeek(Number(e.target.value))}>
            {DAY_LABELS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
        </label>
        <label className="fld" style={{ marginBottom: 0 }}>
          <span>С</span>
          <input className="inp" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} style={{ width: 110 }} />
        </label>
        <label className="fld" style={{ marginBottom: 0 }}>
          <span>До</span>
          <input className="inp" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} style={{ width: 110 }} />
        </label>
        <button className="btn btn-red btn-sm" disabled={saving} onClick={addSlot}>
          {saving ? "Добавляем…" : "+ Добавить"}
        </button>
      </div>
      {error && <div className="mini" style={{ color: "var(--red)", marginTop: 8 }}>{error}</div>}
    </div>
  );
}
