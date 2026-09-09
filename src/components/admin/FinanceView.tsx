"use client";

import { useRouter } from "next/navigation";

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  PENDING_INVOICE: { t: "Ожидает оплаты", c: "pill-mut" },
  IN_ESCROW: { t: "В эскроу", c: "pill-warn" },
  RELEASED: { t: "Выплачено", c: "pill-ok" },
  REFUNDED: { t: "Возврат", c: "pill-red" },
};

function fmtSum(n?: number | null) {
  return (n ?? 0).toLocaleString("ru-RU") + " сум";
}

export default function FinanceView({ payouts }: { payouts: any[] }) {
  const router = useRouter();

  const release = async (id: string, half: "first" | "second") => {
    const res = await fetch(`/api/payouts/${id}/release`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ half }),
    });
    if (res.ok) router.refresh();
    else {
      const data = await res.json();
      alert(data.error || "Не удалось освободить платёж");
    }
  };

  if (payouts.length === 0) return <div className="card card-p mini muted">Транзакций пока нет.</div>;

  return (
    <div className="card" style={{ overflow: "auto" }}>
      <table className="tbl">
        <thead>
          <tr>
            <th>Вакансия</th><th>Рекрутер</th><th className="r">Сумма</th><th className="r">Комиссия</th><th>Статус</th><th></th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((p) => (
            <tr key={p.id}>
              <td><b className="sg">{p.request?.title}</b><div className="mini muted">{p.request?.company?.name}</div></td>
              <td className="mini">{p.recruiter?.name}</td>
              <td className="r">{fmtSum(p.gross)}</td>
              <td className="r" style={{ color: "var(--red)" }}>{p.commission ? fmtSum(p.commission) : "—"}</td>
              <td><span className={`pill ${STATUS_LABEL[p.status].c}`}>{STATUS_LABEL[p.status].t}</span></td>
              <td>
                {p.status === "IN_ESCROW" && !p.firstHalfReleasedAt && (
                  <button className="btn btn-soft btn-sm" onClick={() => release(p.id, "first")}>Выплатить 1-ю половину</button>
                )}
                {p.status === "IN_ESCROW" && p.firstHalfReleasedAt && !p.secondHalfReleasedAt && (
                  <button className="btn btn-soft btn-sm" onClick={() => release(p.id, "second")}>Выплатить 2-ю половину</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
