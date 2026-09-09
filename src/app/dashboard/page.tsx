import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import WithdrawSection from "@/components/WithdrawSection";

function fmtSum(n?: number | null) {
  if (!n) return "0 сум";
  return n.toLocaleString("ru-RU") + " сум";
}

const PAYOUT_STATUS: Record<string, { t: string; c: string }> = {
  PENDING_INVOICE: { t: "Ожидает оплаты", c: "pill-mut" },
  IN_ESCROW: { t: "В эскроу (удержание)", c: "pill-warn" },
  RELEASED: { t: "Выплачено", c: "pill-ok" },
  REFUNDED: { t: "Возврат", c: "pill-red" },
};

export default async function RecruiterPaymentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) redirect("/dashboard");

  const [payouts, withdrawals] = await Promise.all([
    prisma.payout.findMany({
      where: { recruiterId: user.recruiterProfile.id },
      include: { request: { include: { company: true } } },
      orderBy: { hireDate: "desc" },
    }),
    prisma.withdrawal.findMany({
      where: { recruiterId: user.recruiterProfile.id },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  const pending = payouts
    .filter((p) => p.status === "IN_ESCROW")
    .reduce((a, p) => a + (p.gross - (p.commission ?? 0)) / 2, 0);
  const released = payouts
    .filter((p) => p.status === "RELEASED")
    .reduce((a, p) => a + (p.gross - (p.commission ?? 0)), 0);

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Финансы</h3>
        <div className="sub">Баланс, начисления и история выплат</div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(user.recruiterProfile.balance)}</div>
          <div className="l">Доступно к выводу</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(Math.round(pending))}</div>
          <div className="l">В ожидании (эскроу)</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(released)}</div>
          <div className="l">Всего выплачено</div>
        </div>
      </div>

      <WithdrawSection balance={user.recruiterProfile.balance} withdrawals={JSON.parse(JSON.stringify(withdrawals))} />

      <div className="sectit" style={{ fontSize: 15, margin: "20px 0 10px" }}>Начисления по вакансиям</div>
      {payouts.length === 0 && <div className="card card-p mini muted">Пока нет закрытых вакансий.</div>}
      <div className="card" style={{ overflow: "auto" }}>
        {payouts.length > 0 && (
          <table className="tbl">
            <thead>
              <tr>
                <th>Вакансия</th>
                <th className="r">Тариф</th>
                <th className="r">Комиссия</th>
                <th className="r">Ваш доход</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p) => {
                const st = PAYOUT_STATUS[p.status];
                return (
                  <tr key={p.id}>
                    <td><b className="mini">{p.request.title}</b><div className="mini muted">{p.request.company.name}</div></td>
                    <td className="r mini">{fmtSum(p.gross)}</td>
                    <td className="r mini" style={{ color: "var(--red)" }}>{fmtSum(p.commission)}</td>
                    <td className="r mini"><b>{fmtSum(p.gross - (p.commission ?? 0))}</b></td>
                    <td><span className={`pill ${st.c}`}>{st.t}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
