"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { depositFor } from "@/lib/tariffs";

function fmtSum(n: number) {
  return n.toLocaleString("ru-RU") + " сум";
}

export default function CreateRequestForm({ forceOpen }: { forceOpen?: boolean } = {}) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "review">("form");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [skills, setSkills] = useState("");
  const [salaryFrom, setSalaryFrom] = useState("");
  const [salaryTo, setSalaryTo] = useState("");
  const [rewardGross, setRewardGross] = useState("");
  const [depositEnabled, setDepositEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
    const fullDescription = requirements.trim()
      ? `${description}\n\nДополнительные требования:\n${requirements}`
      : description;
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: fullDescription,
        skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
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
            <span className="mini muted">Вакансия</span>
            <b className="sg">{title}</b>
          </div>
          <div className="flex" style={{ justifyContent: "space-between" }}>
            <span className="mini muted">Вознаграждение рекрутеру</span>
            <b className="sg">{fmtSum(rewardNum)}</b>
          </div>
          {depositEnabled ? (
            <>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <span className="mini muted">Депозит к оплате сейчас (50%)</span>
                <b className="sg" style={{ color: "var(--red)" }}>{fmtSum(deposit)}</b>
              </div>
              <div className="flex" style={{ justifyContent: "space-between" }}>
                <span className="mini muted">Остаток при подтверждении найма (50%)</span>
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
        <div className="hint" style={{ marginBottom: 14 }}>
          На заявку сможет откликнуться любое число рекрутеров — вы увидите всех кандидатов и сами решите, чьего нанять.
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
        <textarea className="inp" required value={description} onChange={e => setDescription(e.target.value)} placeholder="Задачи, команда, условия работы…" style={{ minHeight: 110 }} />
      </label>

      <label className="fld">
        <span>Дополнительные требования</span>
        <textarea className="inp" value={requirements} onChange={e => setRequirements(e.target.value)} placeholder={"Например:\nОпыт от 3 лет\nВысшее образование"} style={{ minHeight: 80 }} />
        <span className="hint">Каждое требование — с новой строки. Попадёт в описание вакансии отдельным блоком.</span>
      </label>

      <label className="fld">
        <span>Ключевые навыки</span>
        <input className="inp" value={skills} onChange={e => setSkills(e.target.value)} placeholder="React, TypeScript, Node.js" />
        <span className="hint">Через запятую — покажутся тегами в карточке заявки.</span>
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
        <span className="hint">Сумму устанавливаете вы — сколько получит рекрутер за закрытие этой вакансии.</span>
      </label>

      <label className="fld" style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <input type="checkbox" checked={depositEnabled} onChange={e => setDepositEnabled(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          <b style={{ display: "block" }}>Внести депозит сейчас (рекомендуем)</b>
          <span className="hint" style={{ display: "block", marginTop: 2 }}>
            {depositEnabled
              ? `Депозит 50% (${fmtSum(deposit)}) будет предложен к оплате на следующем шаге. Рекрутер увереннее берётся за заявку, зная, что оплата гарантирована — такие заявки закрываются быстрее.`
              : "Без депозита рекрутеры не защищены от отказа от оплаты, поэтому заявка может закрываться дольше — но платить сейчас ничего не нужно."}
          </span>
        </span>
      </label>

      <div className="hint" style={{ marginBottom: 12 }}>
        Откликнуться на заявку сможет любое число рекрутеров — вы увидите кандидатов от каждого и сами выберете, кого нанять.
      </div>

      {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
      <div className="flex gap8">
        <button className="btn btn-red" type="submit">Далее — проверка и публикация</button>
        <button className="btn btn-ghost" type="button" onClick={reset}>Отмена</button>
      </div>
    </form>
  );
}
