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
    { n: totalEmployers, l: "Работодателей" },
    { n: totalRecruiters, l: "Рекрутеров" },
    { n: verifiedRecruiters, l: "Верифицированных рекрутеров" },
    { n: totalRequests, l: "Всего заявок" },
    { n: openRequests, l: "Открыто на бирже" },
    { n: filledRequests, l: "Закрыто наймом" },
    { n: `${conversionRate}%`, l: "Конверсия заявок в найм" },
    { n: pendingModeration, l: "Ждут модерации" },
  ];

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Статистика платформы</h3>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi"><div className="n" style={{ fontSize: 20 }}>{fmtSum(gmv)}</div><div className="l">GMV — общий оборот</div></div>
        <div className="kpi"><div className="n" style={{ fontSize: 20 }}>{fmtSum(commissionEarned)}</div><div className="l">Заработано комиссии</div></div>
        {kpis.slice(0, 6).map((k, i) => (
          <div key={i} className="kpi"><div className="n" style={{ fontSize: 20 }}>{k.n}</div><div className="l">{k.l}</div></div>
        ))}
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
