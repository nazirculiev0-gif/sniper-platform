import { Wallet, TrendingUp, Building2, Users, ShieldCheck, Briefcase, CheckCircle2, Percent, Clock } from "lucide-react";
import { prisma } from "@/lib/prisma";

function fmtSum(n?: number | null) {
  if (!n) return "0 сум";
  return n.toLocaleString("ru-RU") + " сум";
}

export default async function AdminStatsPage() {
  const [
    totalEmployers,
    totalRecruiters,
    verifiedRecruiters,
    totalRequests,
    openRequests,
    filledRequests,
    pendingModeration,
    openComplaints,
    payouts,
    topRecruiters,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.recruiterProfile.count(),
    prisma.recruiterProfile.count({ where: { verified: true } }),
    prisma.vacancyRequest.count(),
    prisma.vacancyRequest.count({ where: { status: "OPEN" } }),
    prisma.vacancyRequest.count({ where: { status: "FILLED" } }),
    prisma.vacancyRequest.count({ where: { moderation: "PENDING" } }),
    Promise.resolve(0), // жалобы — раздел ещё не реализован
    prisma.payout.findMany(),
    prisma.recruiterProfile.findMany({
      orderBy: { rating: "desc" },
      take: 5,
      include: { _count: { select: { payoutsAsRecruiter: true } } },
    }),
  ]);

  const gmv = payouts.reduce((a, p) => a + p.gross, 0);
  const commissionEarned = payouts
    .filter((p) => p.status === "RELEASED")
    .reduce((a, p) => a + (p.commission ?? 0), 0);
  const conversionRate =
    totalRequests > 0 ? Math.round((filledRequests / totalRequests) * 100) : 0;

  const kpis = [
    { n: fmtSum(gmv), l: "GMV — общий оборот", icon: TrendingUp, c: "#0091AE" },
    { n: fmtSum(commissionEarned), l: "Заработано комиссии", icon: Wallet, c: "#00A38C" },
    { n: totalEmployers, l: "Работодателей", icon: Building2, c: "#7C3AED" },
    { n: totalRecruiters, l: "Рекрутеров", icon: Users, c: "#D4003B" },
    { n: verifiedRecruiters, l: "Верифицированных рекрутеров", icon: ShieldCheck, c: "#00A38C" },
    { n: totalRequests, l: "Всего заявок", icon: Briefcase, c: "#0091AE" },
    { n: openRequests, l: "Открыто на бирже", icon: Briefcase, c: "#E8A33D" },
    { n: filledRequests, l: "Закрыто наймом", icon: CheckCircle2, c: "#00A38C" },
    { n: `${conversionRate}%`, l: "Конверсия заявок в найм", icon: Percent, c: "#7C3AED" },
    { n: pendingModeration, l: "Ждут модерации", icon: Clock, c: "#E8A33D" },
  ];

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Статистика платформы</h3>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="kpi">
              <div className="ic" style={{ background: k.c + "18", color: k.c }}>
                <Icon size={19} />
              </div>
              <div className="n" style={{ fontSize: 20 }}>{k.n}</div>
              <div className="l">{k.l}</div>
            </div>
          );
        })}
      </div>

      <div className="sectit" style={{ fontSize: 15, marginBottom: 10 }}>Топ-5 рекрутеров по рейтингу</div>
      <div className="card" style={{ overflow: "auto" }}>
        <table className="tbl">
          <thead>
            <tr><th>Рекрутер</th><th className="r">Рейтинг</th><th className="r">Закрыто вакансий</th></tr>
          </thead>
          <tbody>
            {topRecruiters.map((r) => (
              <tr key={r.id}>
                <td><b className="mini">{r.name}</b></td>
                <td className="r mini">★ {r.rating.toFixed(1)}</td>
                <td className="r mini">{r._count.payoutsAsRecruiter}</td>
              </tr>
            ))}
            {topRecruiters.length === 0 && (
              <tr><td colSpan={3} className="mini muted" style={{ padding: 20, textAlign: "center" }}>Пока нет данных</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
