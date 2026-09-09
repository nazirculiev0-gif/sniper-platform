"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TARIFFS, depositFor } from "@/lib/tariffs";

function fmtSum(n: number) {
  return n.toLocaleString("ru-RU") + " сум";
}

export default function CreateRequestForm({ forceOpen }: { forceOpen?: boolean } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "pay">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tariffCategory, setTariffCategory] = useState<keyof typeof TARIFFS>("MIDDLE");
  const [mode, setMode] = useState<"OPEN" | "EXCLUSIVE">("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const tariff = TARIFFS[tariffCategory];
  const deposit = depositFor(tariff.amount);

  const reset = () => {
    router.push("/dashboard/requests");
  };

  const goToPay = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("pay");
  };

  const payAndPublish = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, tariffCategory, mode, skills: [] }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      return;
    }
    router.push("/dashboard/requests");
  };

  if (step === "pay") {
    return (
      <div className="card card-p" style={{ marginBottom: 10, borderLeft: "3px solid var(--info)" }}>
        <div className="sectit" style={{ fontSize: 14, marginBottom: 10 }}>Оплата депозита и публикация</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="mini muted">Тариф закрытия ({tariff.label})</span>
            <b className="sg">{fmtSum(tariff.amount)}</b>
          </div>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="mini muted">Депозит к оплате сейчас (15%)</span>
            <b className="sg" style={{ color: "var(--red)" }}>{fmtSum(deposit)}</b>
          </div>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="mini muted">Остаток при подтверждении найма (85%)</span>
            <b className="sg">{fmtSum(tariff.amount - deposit)}</b>
          </div>
        </div>
        <div className="hint" style={{ marginBottom: 14 }}>
          Депозит удерживается на эскроу-счёте платформы и возвращается полностью, если заявка отозвана
          до момента, пока её не закрепит рекрутер. В реальной системе здесь открывается платёжная форма
          Payme/Click — для демонстрации оплата считается прошедшей мгновенно.
        </div>
        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
        <div className="flex gap8">
          <button className="btn btn-red" disabled={loading} onClick={payAndPublish}>
            {loading ? "Оплачиваем…" : `Оплатить ${fmtSum(deposit)} и опубликовать`}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setStep("form")}>Назад</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={goToPay} className="card card-p" style={{ marginBottom: 10 }}>
      <label className="fld">
        <span>Название вакансии <em>*</em></span>
        <input className="inp" required value={title} onChange={e => setTitle(e.target.value)} />
      </label>
      <label className="fld">
        <span>Описание <em>*</em></span>
        <textarea className="inp" required value={description} onChange={e => setDescription(e.target.value)} />
      </label>
      <label className="fld">
        <span>Тариф закрытия <em>*</em></span>
        <select className="inp" value={tariffCategory} onChange={e => setTariffCategory(e.target.value as any)}>
          {Object.entries(TARIFFS).map(([key, t]) => (
            <option key={key} value={key}>
              {t.label} — {fmtSum(t.amount)} ({t.hint})
            </option>
          ))}
        </select>
      </label>
      <label className="fld">
        <span>Режим</span>
        <select className="inp" value={mode} onChange={e => setMode(e.target.value as any)}>
          <option value="OPEN">Открытая (много рекрутеров)</option>
          <option value="EXCLUSIVE">Эксклюзив (один рекрутер)</option>
        </select>
      </label>
      <div className="hint" style={{ marginBottom: 12 }}>
        Депозит 15% ({fmtSum(deposit)}) будет предложен к оплате на следующем шаге.
      </div>
      <div className="flex gap8">
        <button className="btn btn-red" type="submit">Далее — оплата депозита</button>
        <button className="btn btn-ghost" type="button" onClick={reset}>Отмена</button>
      </div>
    </form>
  );
}
