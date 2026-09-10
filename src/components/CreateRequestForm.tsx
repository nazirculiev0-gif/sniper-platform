"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TARIFFS, depositFor } from "@/lib/tariffs";

function fmtSum(n: number) {
  return n.toLocaleString("ru-RU") + " сум";
}

export default function CreateRequestForm({ forceOpen }: { forceOpen?: boolean } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "review">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tariffCategory, setTariffCategory] = useState<keyof typeof TARIFFS>("MIDDLE");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [rewardGross, setRewardGross] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(true);
  const [mode, setMode] = useState<"OPEN" | "EXCLUSIVE">("OPEN");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const grade = TARIFFS[tariffCategory];
  const rewardNum = Number(rewardGross) || 0;
  const deposit = depositFor(rewardNum);

  const reset = () => {
    router.push("/dashboard/requests");
  };

  const goToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (rewardNum < 100_000) {
      setError("Укажите вознаграждение рекрутеру — от 100 000 сум");
      return;
    }
    setError("");
    setStep("review");
  };

  const publish = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        tariffCategory,
        mode,
        skills: [],
        salaryFrom: salaryFrom ? Number(salaryFrom) : undefined,
        salaryTo: salaryTo ? Number(salaryTo) : undefined,
        rewardGross: rewardNum,
        depositEnabled,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(JSON.stringify(data.error));
      return;
    }
    router.push("/dashboard/requests");
  };

  if (step === "review") {
    return (
      <div className="card card-p" style={{ marginBottom: 10, borderLeft: "3px solid var(--info)" }}>
        <div className="sectit" style={{ fontSize: 14, marginBottom: 10 }}>Проверка перед публикацией</div>
        <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="mini muted">Вознаграждение рекрутеру</span>
            <b className="sg">{fmtSum(rewardNum)}</b>
          </div>
          {depositEnabled ? (
            <>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <span className="mini muted">Депозит к оплате сейчас (15%)</span>
                <b className="sg" style={{ color: "var(--red)" }}>{fmtSum(deposit)}</b>
              </div>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <span className="mini muted">Остаток при подтверждении найма (85%)</span>
                <b className="sg">{fmtSum(rewardNum - deposit)}</b>
              </div>
            </>
          ) : (
            <div className="flex" style={{ justifyContent: "space-between" }}>
              <span className="mini muted">Депозит</span>
              <b className="sg">Без депозита</b>
            </div>
          )}
        </div>
        <div className="hint" style={{ marginBottom: 14 }}>
          {depositEnabled
            ? "Депозит удерживается на эскроу-счёте платформы и возвращается полностью, если заявка отозвана до того, как ей займётся хотя бы один рекрутер. В реальной системе здесь открывается платёжная форма Payme/Click — для демонстрации оплата считается прошедшей мгновенно."
            : "Без депозита вознаграждение выплачивается только после подтверждения найма. Такие заявки не гарантируют оплату заранее, поэтому рекрутеры могут закрывать их медленнее — приоритет обычно отдаётся заявкам с депозитом."}
        </div>
        {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
        <div className="flex gap8">
          <button className="btn btn-red" disabled={loading} onClick={publish}>
            {loading ? "Публикуем…" : depositEnabled ? `Оплатить ${fmtSum(deposit)} и опубликовать` : "Опубликовать"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={() => setStep("form")}>Назад</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={goToReview} className="card card-p" style={{ marginBottom: 10 }}>
      <label className="fld">
        <span>Название вакансии <em>*</em></span>
        <input className="inp" required value={title} onChange={e => setTitle(e.target.value)} placeholder="напр. Senior Frontend-разработчик" />
      </label>
      <label className="fld">
        <span>Описание <em>*</em></span>
        <textarea className="inp" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Задачи, команда, условия…" />
      </label>
      <label className="fld">
        <span>Грейд</span>
        <select className="inp" value={tariffCategory} onChange={e => setTariffCategory(e.target.value as any)}>
          {Object.entries(TARIFFS).map(([key, t]) => (
            <option key={key} value={key}>{t.label} — {t.hint}</option>
          ))}
        </select>
        <span className="hint">Грейд нужен только для фильтра на бирже, на сумму он не влияет.</span>
      </label>
      <div className="flex gap8 wrapf">
        <label className="fld" style={{ flex: 1, minWidth: 160 }}>
          <span>Зарплата от, сум</span>
          <input className="inp" type="number" min={0} value={salaryFrom} onChange={e => setSalaryFrom(e.target.value)} />
        </label>
        <label className="fld" style={{ flex: 1, minWidth: 160 }}>
          <span>Зарплата до, сум</span>
          <input className="inp" type="number" min={0} value={salaryTo} onChange={e => setSalaryTo(e.target.value)} />
        </label>
      </div>
      <label className="fld">
        <span>Вознаграждение рекрутеру, сум <em>*</em></span>
        <input
          className="inp"
          type="number"
          min={100000}
          step={100000}
          required
          value={rewardGross}
          onChange={e => setRewardGross(e.target.value)}
          placeholder="напр. 8 000 000"
        />
        <span className="hint">Сумму устанавливаете вы. Ориентир для «{grade.label}»: {fmtSum(grade.suggestedRange[0])}–{fmtSum(grade.suggestedRange[1])}.</span>
      </label>

      <label className="fld" style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <input type="checkbox" checked={depositEnabled} onChange={e => setDepositEnabled(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          <b style={{ display: "block" }}>Внести депозит сейчас (рекомендуем)</b>
          <span className="hint" style={{ display: "block", marginTop: 2 }}>
            {depositEnabled
              ? `Депозит 15% (${fmtSum(deposit)}) будет предложен к оплате на следующем шаге. Рекрутер увереннее берётся за заявку, зная, что оплата гарантирована — такие заявки закрываются быстрее.`
              : "Без депозита рекрутеры не защищены от отказа от оплаты, поэтому заявка может закрываться дольше — но платить сейчас ничего не нужно."}
          </span>
        </span>
      </label>

      <label className="fld">
        <span>Режим</span>
        <select className="inp" value={mode} onChange={e => setMode(e.target.value as any)}>
          <option value="OPEN">Открытая — откликнуться могут несколько рекрутеров, вы сами выберете, чьего кандидата нанять</option>
          <option value="EXCLUSIVE">Эксклюзив — заявку ведёт один рекрутер</option>
        </select>
      </label>

      {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
      <div className="flex gap8">
        <button className="btn btn-red" type="submit">Далее — проверка и публикация</button>
        <button className="btn btn-ghost" type="button" onClick={reset}>Отмена</button>
      </div>
    </form>
  );
}
