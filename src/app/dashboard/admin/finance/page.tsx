import { prisma } from "@/lib/prisma";
import FinanceView from "@/components/admin/FinanceView";

export default async function AdminFinancePage() {
  const payouts = await prisma.payout.findMany({
    include: { request: { include: { company: true } }, recruiter: true },
    orderBy: { hireDate: "desc" },
  });

  const gmv = payouts
    .filter((p) => p.status === "IN_ESCROW" || p.status === "RELEASED")
    .reduce((a, p) => a + p.gross, 0);
  const commissionEarned = payouts
    .filter((p) => p.status === "RELEASED")
    .reduce((a, p) => a + (p.commission ?? 0), 0);
  const inEscrowCount = payouts.filter((p) => p.status === "IN_ESCROW").length;

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
      </div>
      <FinanceView payouts={JSON.parse(JSON.stringify(payouts))} />
    </div>
  );
}
