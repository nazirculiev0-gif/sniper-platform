import Link from "next/link";
import { Wallet, TrendingUp, Building2, Users, ShieldCheck, Briefcase, CheckCircle2, Percent, Clock, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";

function fmtSum(n?: number | null) {
  if (!n) return "0 сум";
  return n.toLocaleString("ru-RU") + " сум";
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Черновик",
  MODERATION: "На модерации",
  OPEN: "На бирже",
  IN_PROGRESS: "В работе",
  FILLED: "Найм закрыт",
  CLOSED: "Закрыта",
};

function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / data.length;
  return (
    <svg viewBox="0 0 100 46" style={{ width: "100%", height: 90 }} preserveAspectRatio="none">
      {data.map((d, i) => {
        const h = (d.value / max) * 32;
        return (
          <g key={i}>
            <rect x={i * w + w * 0.18} y={34 - h} width={w * 0.64} height={h} fill="var(--info)" rx={0.6} />
            <text x={i * w + w / 2} y={40} fontSize={3.4} textAnchor="middle" fill="var(--mid)">{d.label}</text>
            {d.value > 0 && (
              <text x={i * w + w / 2} y={34 - h - 1.5} fontSize={3.4} textAnchor="middle" fill="var(--dark)">{d.value}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default async function AdminStatsPage() {
  const since14 = new Date();
  since14.setHours(0, 0, 0, 0);
  since14.setDate(since14.getDate() - 13);
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalEmployers,
    totalRecruiters,
    verifiedRecruiters,
    totalRequests,
    openRequests,
    filledRequests,
    pendingModeration,
    pendingWithdrawals,
    activeRecruiters30d,
    payouts,
    topRecruiters,
    statusGroups,
    recentRequests,
    payoutsForHireTime,
    topCompaniesRaw,
  ] = await Promise.all([
    prisma.company.count(),
    prisma.recruiterProfile.count(),
    prisma.recruiterProfile.count({ where: { verified: true } }),
    prisma.vacancyRequest.count(),
    prisma.vacancyRequest.count({ where: { status: "OPEN" } }),
    prisma.vacancyRequest.count({ where: { status: "FILLED" } }),
    prisma.vacancyRequest.count({ where: { moderation: "PENDING" } }),
    prisma.withdrawal.count({ where: { status: "PENDING" } }),
    prisma.recruiterProfile.count({ where: { participations: { some: { joinedAt: { gte: since30 } } } } }),
    prisma.payout.findMany(),
    prisma.recruiterProfile.findMany({
      orderBy: { rating: "desc" },
      take: 5,
      include: { _count: { select: { payoutsAsRecruiter: true } } },
    }),
    prisma.vacancyRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.vacancyRequest.findMany({ where: { createdAt: { gte: since14 } }, select: { createdAt: true } }),
    prisma.payout.findMany({ include: { request: { select: { createdAt: true } } } }),
    prisma.payout.findMany({ include: { request: { include: { company: true } } } }),
  ]);

  const gmv = payouts.reduce((a, p) => a + p.gross, 0);
  const commissionEarned = payouts
    .filter((p) => p.status === "RELEASED")
    .reduce((a, p) => a + (p.commission ?? 0), 0);
  const conversionRate =
    totalRequests > 0 ? Math.round((filledRequests / totalRequests) * 100) : 0;
  const unverifiedRecruiters = totalRecruiters - verifiedRecruiters;

  const timeToHireDays = payoutsForHireTime
    .filter((p) => p.request?.createdAt)
    .map((p) => (p.hireDate.getTime() - p.request!.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const avgTimeToHire =
    timeToHireDays.length > 0
      ? Math.round((timeToHireDays.reduce((a, b) => a + b, 0) / timeToHireDays.length) * 10) / 10
      : null;

  const chartData: { label: string; value: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const day = new Date(since14);
    day.setDate(since14.getDate() + i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const count = recentRequests.filter((r) => r.createdAt >= day && r.createdAt < next).length;
    chartData.push({ label: `${day.getDate()}.${day.getMonth() + 1}`, value: count });
  }

  const byCompany: Record<string, { name: string; total: number }> = {};
  for (const p of topCompaniesRaw) {
    const cid = p.request?.companyId;
    if (!cid) continue;
    if (!byCompany[cid]) byCompany[cid] = { name: p.request!.company.name, total: 0 };
    byCompany[cid].total += p.gross;
  }
  const topCompanies = Object.values(byCompany).sort((a, b) => b.total - a.total).slice(0, 5);

  const kpis = [
    { n: fmtSum(gmv), l: "GMV — общий оборот", icon: TrendingUp, c: "#0091AE" },
    { n: fmtSum(commissionEarned), l: "Заработано комиссии", icon: Wallet, c: "#00A38C" },
    { n: totalEmployers, l: "Работодателей", icon: Building2, c: "#7C3AED" },
    { n: `${totalRecruiters} (${activeRecruiters30d} акт.)`, l: "Рекрутеров, активных за 30 дн.", icon: Users, c: "#D4003B" },
    { n: verifiedRecruiters, l: "Верифицированных рекрутеров", icon: ShieldCheck, c: "#00A38C" },
    { n: totalRequests, l: "Всего заявок", icon: Briefcase, c: "#0091AE" },
    { n: openRequests, l: "Открыто на бирже", icon: Briefcase, c: "#E8A33D" },
    { n: filledRequests, l: "Закрыто наймом", icon: CheckCircle2, c: "#00A38C" },
    { n: `${conversionRate}%`, l: "Конверсия заявок в найм", icon: Percent, c: "#7C3AED" },
    { n: avgTimeToHire !== null ? `${avgTimeToHire} дн.` : "—", l: "Среднее время закрытия", icon: Clock, c: "#E8A33D" },
  ];

  const attentionItems = [
    { count: pendingModeration, label: "заявок ждут модерации", href: "/dashboard/admin/requests" },
    { count: unverifiedRecruiters, label: "рекрутеров не верифицированы", href: "/dashboard/admin/recruiters" },
    { count: pendingWithdrawals, label: "запросов на вывод в обработке", href: "/dashboard/admin/finance" },
  ].filter((i) => i.count > 0);

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Статистика платформы</h3>
      </div>

      {attentionItems.length > 0 && (
        <div className="card card-p" style={{ marginBottom: 18, borderLeft: "3px solid var(--warn)" }}>
          <div className="flex gap8" style={{ alignItems: "center", marginBottom: 10 }}>
            <AlertTriangle size={16} color="var(--warn)" />
            <b className="mini">Требует внимания</b>
          </div>
          <div className="flex gap8 wrapf">
            {attentionItems.map((i) => (
              <Link key={i.href} href={i.href} className="pill pill-warn" style={{ textDecoration: "none" }}>
                {i.count} {i.label}
              </Link>
            ))}
          </div>
        </div>
      )}

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

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)", gap: 18, marginBottom: 18 }}>
        <div className="card card-p">
          <div className="sectit" style={{ fontSize: 14, marginBottom: 8 }}>Новые заявки за 14 дней</div>
          <MiniBarChart data={chartData} />
        </div>
        <div className="card card-p">
          <div className="sectit" style={{ fontSize: 14, marginBottom: 10 }}>Воронка заявок по статусам</div>
          <div style={{ display: "grid", gap: 8 }}>
            {statusGroups
              .sort((a, b) => b._count._all - a._count._all)
              .map((g) => {
                const pct = totalRequests > 0 ? Math.round((g._count._all / totalRequests) * 100) : 0;
                return (
                  <div key={g.status}>
                    <div className="flex" style={{ justifyContent: "space-between", marginBottom: 3 }}>
                      <span className="mini muted">{STATUS_LABEL[g.status] ?? g.status}</span>
                      <span className="mini"><b>{g._count._all}</b></span>
                    </div>
                    <div style={{ height: 6, background: "var(--line2)", borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: "var(--info)" }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 18 }}>
        <div>
          <div className="sectit" style={{ fontSize: 15, marginBottom: 10 }}>Топ-5 рекрутеров по рейтингу</div>
          <div className="card" style={{ overflow: "auto" }}>
            <table className="tbl">
              <thead>
                <tr><th>Рекрутер</th><th className="r">Рейтинг</th><th className="r">Закрыто</th></tr>
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

        <div>
          <div className="sectit" style={{ fontSize: 15, marginBottom: 10 }}>Топ-5 работодателей по тратам</div>
          <div className="card" style={{ overflow: "auto" }}>
            <table className="tbl">
              <thead>
                <tr><th>Компания</th><th className="r">Оплачено</th></tr>
              </thead>
              <tbody>
                {topCompanies.map((c, i) => (
                  <tr key={i}>
                    <td><b className="mini">{c.name}</b></td>
                    <td className="r mini">{fmtSum(c.total)}</td>
                  </tr>
                ))}
                {topCompanies.length === 0 && (
                  <tr><td colSpan={2} className="mini muted" style={{ padding: 20, textAlign: "center" }}>Пока нет данных</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
