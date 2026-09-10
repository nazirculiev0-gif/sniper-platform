import Link from "next/link";
import { Briefcase, Flame, UsersRound, CheckCircle2, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Top from "@/components/Top";
import { TARIFFS } from "@/lib/tariffs";

function fmtSum(n?: number | null) {
  if (!n) return "0 сум";
  return n.toLocaleString("ru-RU") + " сум";
}

function daysLeft(deadline?: Date | null) {
  if (!deadline) return null;
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  DRAFT: { t: "Черновик", c: "pill-mut" },
  MODERATION: { t: "На модерации", c: "pill-warn" },
  OPEN: { t: "На бирже", c: "pill-ok" },
  IN_PROGRESS: { t: "В работе", c: "pill-info" },
  FILLED: { t: "Найм закрыт", c: "pill-ok" },
  CLOSED: { t: "Закрыта", c: "pill-mut" },
};

export default async function EmployerOverview({ companyId }: { companyId: string }) {
  const company = await prisma.company.findUnique({ where: { id: companyId } });

  const requests = await prisma.vacancyRequest.findMany({
    where: { companyId, status: { notIn: ["CLOSED"] } },
    include: { participants: { include: { recruiter: true } }, _count: { select: { candidates: true } } },
    orderBy: { createdAt: "desc" },
  });

  const allRequests = await prisma.vacancyRequest.findMany({ where: { companyId } });
  const depositHeld = allRequests
    .filter((r) => r.depositPaid && !r.depositRefundedAt && r.status !== "FILLED" && r.status !== "CLOSED")
    .reduce((a, r) => a + r.depositAmount, 0);

  const totalCandidates = await prisma.candidate.count({
    where: { request: { companyId } },
  });

  const kpis = [
    { n: allRequests.filter((r) => r.status === "OPEN").length, l: "На бирже", icon: Briefcase, c: "#0091AE" },
    { n: allRequests.filter((r) => r.status === "IN_PROGRESS").length, l: "В работе у рекрутеров", icon: Flame, c: "#D4003B" },
    { n: totalCandidates, l: "Кандидатов получено", icon: UsersRound, c: "#7C3AED" },
    { n: allRequests.filter((r) => r.status === "FILLED").length, l: "Закрыто наймов", icon: CheckCircle2, c: "#00A38C" },
  ];

  return (
    <div>
      <Top
        title="Обзор"
        sub={`Компания «${company?.name}»`}
        right={<Link href="/dashboard/requests/new" className="btn btn-red">+ Создать заявку</Link>}
      />

      {depositHeld > 0 && (
        <div className="card card-p" style={{ marginBottom: 18, borderLeft: "4px solid var(--ok)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "var(--okbg)", color: "var(--ok)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Wallet size={19} />
          </div>
          <div style={{ flex: 1 }}>
            <b className="sg">{fmtSum(depositHeld)} держится в депозите</b>
            <div className="mini muted">По заявкам с внесённым депозитом — выплата рекрутеру пройдёт без задержек. Подробности — в «Выплаты».</div>
          </div>
          <Link href="/dashboard/payments" className="btn btn-ghost btn-sm">→</Link>
        </div>
      )}

      <div className="grid-kpi" style={{ marginBottom: 24 }}>
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <div key={i} className="kpi">
              <div className="ic" style={{ background: k.c + "18", color: k.c }}>
                <Icon size={19} />
              </div>
              <div className="n" style={{ fontSize: 26 }}>{k.n}</div>
              <div className="l">{k.l}</div>
            </div>
          );
        })}
      </div>

      <div className="sectit" style={{ fontSize: 15, marginBottom: 12 }}>Активные заявки</div>
      {requests.length === 0 && (
        <div className="card card-p mini muted">Пока нет активных заявок — создайте первую.</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {requests.map((r) => {
          const tariff = TARIFFS[r.tariffCategory as keyof typeof TARIFFS];
          const st = STATUS_LABEL[r.status];
          const left = r.status === "IN_PROGRESS" ? daysLeft(r.claimDeadline) : null;
          return (
            <Link
              key={r.id}
              href={`/dashboard/requests/${r.id}`}
              className="card card-p card-hover"
              style={{ textDecoration: "none", color: "inherit", display: "block" }}
            >
              <div className="flex gap8" style={{ marginBottom: 10 }}>
                <div className="av" style={{ width: 34, height: 34, fontSize: 13, background: "var(--dark)" }}>
                  {r.title.slice(0, 1).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="mini" style={{ display: "block" }}>{r.title}</b>
                  <div className="mini muted">{tariff?.label} · Ташкент</div>
                </div>
                <span className={`pill ${st.c}`} style={{ flexShrink: 0 }}>{st.t}</span>
              </div>
              <div className="flex gap8 wrapf" style={{ marginBottom: 10 }}>
                {r.salaryFrom && r.salaryTo && (
                  <span className="tag">{fmtSum(r.salaryFrom)} – {fmtSum(r.salaryTo)}</span>
                )}
                <span className="tag">{r._count.candidates} канд.</span>
                {r.depositPaid && <span className="tag" style={{ color: "var(--ok)" }}>Депозит</span>}
              </div>
              {r.participants.slice(0, 2).map((p) => (
                <span key={p.recruiterId} className="tag" style={{ marginRight: 6 }}>{p.recruiter.name}</span>
              ))}
              <div className="flex" style={{ justifyContent: "space-between", marginTop: 10, alignItems: "center" }}>
                {left !== null ? (
                  <span className="mini muted">⏱ {left <= 0 ? "сегодня" : `${left} дн. до автовозврата`}</span>
                ) : <span />}
                <b className="sg" style={{ fontSize: 15 }}>{fmtSum(r.rewardGross)}</b>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
