import { prisma } from "@/lib/prisma";
import FinanceView from "@/components/admin/FinanceView";
import WithdrawalsAdminView from "@/components/admin/WithdrawalsAdminView";

export default async function AdminFinancePage() {
  const [payouts, withdrawals] = await Promise.all([
    prisma.payout.findMany({
      include: { request: { include: { company: true } }, recruiter: true },
      orderBy: { hireDate: "desc" },
    }),
    prisma.withdrawal.findMany({
      include: { recruiter: true },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  const gmv = payouts
    .filter((p) => p.status === "IN_ESCROW" || p.status === "RELEASED")
    .reduce((a, p) => a + p.gross, 0);
  const commissionEarned = payouts
    .filter((p) => p.status === "RELEASED")
    .reduce((a, p) => a + (p.commission ?? 0), 0);
  const inEscrowCount = payouts.filter((p) => p.status === "IN_ESCROW").length;
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "PENDING");
  const pendingWithdrawalsSum = pendingWithdrawals.reduce((a, w) => a + w.amount, 0);

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Финансы платформы</h3>
      </div>
      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{gmv.toLocaleString("ru-RU")}</div>
          <div className="l">Оборот (GMV), сум</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{commissionEarned.toLocaleString("ru-RU")}</div>
          <div className="l">Комиссия заработана, сум</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{inEscrowCount}</div>
          <div className="l">Платежей в эскроу</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{pendingWithdrawals.length} · {pendingWithdrawalsSum.toLocaleString("ru-RU")}</div>
          <div className="l">Заявок на вывод в ожидании, сум</div>
        </div>
      </div>

      <div className="sectit" style={{ fontSize: 15, margin: "0 0 10px" }}>Запросы на вывод средств</div>
      <WithdrawalsAdminView withdrawals={JSON.parse(JSON.stringify(withdrawals))} />

      <div className="sectit" style={{ fontSize: 15, margin: "24px 0 10px" }}>Начисления по вакансиям</div>
      <FinanceView payouts={JSON.parse(JSON.stringify(payouts))} />
    </div>
  );
}
