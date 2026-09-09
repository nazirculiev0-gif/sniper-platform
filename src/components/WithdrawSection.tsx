"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function fmtSum(n?: number | null) {
  if (!n) return "0 сум";
  return n.toLocaleString("ru-RU") + " сум";
}

const STATUS: Record<string, { t: string; c: string }> = {
  PENDING: { t: "В обработке", c: "pill-warn" },
  PAID: { t: "Выплачено", c: "pill-ok" },
  REJECTED: { t: "Отклонено", c: "pill-red" },
};

export default function WithdrawSection({ balance, withdrawals }: { balance: number; withdrawals: any[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(balance));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setLoading(true);
    setError("");
    const res = await fetch("/api/withdrawals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount.replace(/\D/g, "")) }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Не удалось создать запрос");
      return;
    }
    setOpen(false);
    router.refresh();
  };

  return (
    <div>
      <div className="flex gap8" style={{ marginBottom: 14 }}>
        <button className="btn btn-red btn-sm" disabled={balance <= 0} onClick={() => { setAmount(String(balance)); setOpen(true); }}>
          Запросить вывод средств
        </button>
        {balance <= 0 && <span className="mini muted">Нет доступного баланса для вывода</span>}
      </div>

      {open && (
        <div className="card card-p" style={{ marginBottom: 14, borderLeft: "3px solid var(--info)" }}>
          <label className="fld">
            <span>Сумма к выводу (макс. {fmtSum(balance)})</span>
            <input className="inp" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          {error && <div className="mini" style={{ color: "var(--red)", marginBottom: 10 }}>{error}</div>}
          <div className="flex gap8">
            <button className="btn btn-red btn-sm" disabled={loading} onClick={submit}>
              {loading ? "Отправляем…" : "Отправить запрос"}
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Отмена</button>
          </div>
        </div>
      )}

      {withdrawals.length > 0 && (
        <div className="card" style={{ overflow: "auto" }}>
          <table className="tbl">
            <thead>
              <tr><th>Дата</th><th className="r">Сумма</th><th>Статус</th></tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const st = STATUS[w.status];
                return (
                  <tr key={w.id}>
                    <td className="mini">{new Date(w.requestedAt).toLocaleDateString("ru-RU")}</td>
                    <td className="r mini"><b>{fmtSum(w.amount)}</b></td>
                    <td><span className={`pill ${st.c}`}>{st.t}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
