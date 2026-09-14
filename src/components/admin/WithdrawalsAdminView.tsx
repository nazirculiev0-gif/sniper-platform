"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  PENDING: { t: "В обработке", c: "pill-warn" },
  PAID: { t: "Выплачено", c: "pill-ok" },
  REJECTED: { t: "Отклонено", c: "pill-red" },
};

function fmtSum(n?: number | null) {
  return (n ?? 0).toLocaleString("ru-RU") + " сум";
}

export default function WithdrawalsAdminView({ withdrawals }: { withdrawals: any[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const act = async (id: string, status: "PAID" | "REJECTED") => {
    if (status === "REJECTED" && !confirm("Отклонить запрос? Сумма вернётся на баланс рекрутера.")) return;
    setBusyId(id);
    const res = await fetch(`/api/withdrawals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось обработать запрос");
    }
  };

  if (withdrawals.length === 0) {
    return <div className="card card-p mini muted">Запросов на вывод пока нет.</div>;
  }

  return (
    <div className="card" style={{ overflow: "auto" }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Дата</th>
            <th>Рекрутер</th>
            <th>Карта для перевода</th>
            <th className="r">Сумма</th>
            <th>Статус</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {withdrawals.map((w) => {
            const st = STATUS_LABEL[w.status];
            const rec = w.recruiter;
            return (
              <tr key={w.id}>
                <td className="mini">{new Date(w.requestedAt).toLocaleDateString("ru-RU")}</td>
                <td>
                  <b className="mini" style={{ display: "block" }}>{rec?.name}</b>
                  {rec?.isSelfEmployed && <span className="mini muted">Самозанятый{rec.taxId ? ` · ${rec.taxId}` : ""}</span>}
                </td>
                <td className="mini">
                  {rec?.cardLast4 ? (
                    <>
                      {rec.cardBrand} •••• {rec.cardLast4}
                      <div className="mini muted">{rec.cardHolder}</div>
                    </>
                  ) : (
                    <span className="mini muted">Карта не привязана</span>
                  )}
                </td>
                <td className="r mini"><b>{fmtSum(w.amount)}</b></td>
                <td><span className={`pill ${st.c}`}>{st.t}</span></td>
                <td>
                  {w.status === "PENDING" && (
                    <div className="flex gap8">
                      <button className="btn btn-ok btn-sm" disabled={busyId === w.id} onClick={() => act(w.id, "PAID")}>
                        Отметить выполненным
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: "var(--red)" }} disabled={busyId === w.id} onClick={() => act(w.id, "REJECTED")}>
                        Отклонить
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
