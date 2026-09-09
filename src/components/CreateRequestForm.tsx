"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateRequestForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rewardGross, setRewardGross] = useState("");
  const [mode, setMode] = useState<"OPEN" | "EXCLUSIVE">("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!open) {
    return (
      <button className="btn btn-red" onClick={() => setOpen(true)}>
        + Создать заявку
      </button>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        rewardGross: Number(rewardGross.replace(/\D/g, "")),
        mode,
        skills: [],
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      return;
    }
    setOpen(false);
    setTitle(""); setDescription(""); setRewardGross("");
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="card card-p" style={{ marginBottom: 10 }}>
      <label className="fld">
        <span>Название вакансии <em>*</em></span>
        <input className="inp" required value={title} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="fld">
        <span>Описание <em>*</em></span>
        <textarea className="inp" required value={description} onChange={e => setDescription(e.target.value)} />
      </label>
      <div className="row2" style={{ display: "flex", gap: 12 }}>
        <label className="fld" style={{ flex: 1 }}>
          <span>Вознаграждение, сум <em>*</em></span>
          <input className="inp" required value={rewardGross} onChange={e => setRewardGross(e.target.value)} />
        </label>
        <label className="fld" style={{ flex: 1 }}>
          <span>Режим</span>
          <select className="inp" value={mode} onChange={e => setMode(e.target.value as any)}>
            <option value="OPEN">Открытая (много рекрутеров)</option>
            <option value="EXCLUSIVE">Эксклюзив (один рекрутер)</option>
          </select>
        </label>
      </div>
      {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
      <div className="flex gap8">
        <button className="btn btn-red" disabled={loading} type="submit">
          {loading ? "Отправляем…" : "Отправить на модерацию"}
        </button>
        <button className="btn btn-ghost" type="button" onClick={() => setOpen(false)}>Отмена</button>
      </div>
    </form>
  );
}
