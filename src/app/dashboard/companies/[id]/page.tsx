import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("ru-RU", { year: "numeric", month: "long" });
}

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  DRAFT: { t: "Черновик", c: "pill-mut" },
  MODERATION: { t: "На модерации", c: "pill-warn" },
  OPEN: { t: "На бирже", c: "pill-ok" },
  IN_PROGRESS: { t: "В работе", c: "pill-info" },
  FILLED: { t: "Найм закрыт", c: "pill-ok" },
  CLOSED: { t: "Закрыта", c: "pill-mut" },
};

export default async function CompanyPublicProfile({ params }: { params: { id: string } }) {
  const company = await prisma.company.findUnique({
    where: { id: params.id },
    include: {
      requests: {
        include: { payout: true, _count: { select: { candidates: true } } },
        orderBy: { createdAt: "desc" },
      },
      availabilitySlots: { orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  });
  if (!company) notFound();

  const DAY_LABELS = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];

  const totalRequests = company.requests.length;
  const filledRequests = company.requests.filter((r) => r.status === "FILLED").length;
  const openRequests = company.requests.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS").length;
  const totalPaidOut = company.requests.reduce((a, r) => a + (r.payout?.gross ?? 0), 0);
  const conversionRate = totalRequests > 0 ? Math.round((filledRequests / totalRequests) * 100) : 0;
  const visibleRequests = company.requests.filter((r) => r.status !== "DRAFT" && r.status !== "MODERATION");

  return (
    <div>
      <div className="card card-p" style={{ marginBottom: 18 }}>
        <div className="flex gap8" style={{ alignItems: "center" }}>
          <div className="av" style={{ width: 56, height: 56, fontSize: 20, background: "var(--dark)" }}>
            {company.name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex gap8" style={{ alignItems: "center" }}>
              <b className="sg" style={{ fontSize: 18 }}>{company.name}</b>
              {company.verified && <span className="pill pill-ok">Верифицирована</span>}
            </div>
            <div className="mini muted" style={{ marginTop: 4 }}>
              {company.industry || "Отрасль не указана"} · Ташкент · на платформе с {fmtDate(company.createdAt)}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="n" style={{ fontSize: 22 }}>{totalRequests}</div>
          <div className="l">Вакансий опубликовано</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 22 }}>{filledRequests}</div>
          <div className="l">Закрыто наймом</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 22 }}>{conversionRate}%</div>
          <div className="l">Конверсия в найм</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(totalPaidOut)}</div>
          <div className="l">Выплачено рекрутерам</div>
        </div>
      </div>

      {company.availabilitySlots.length > 0 && (
        <div className="card card-p" style={{ marginBottom: 18 }}>
          <div className="mini muted" style={{ marginBottom: 8, textTransform: "uppercase", fontSize: 10.5, letterSpacing: ".04em" }}>
            Доступность для собеседований
          </div>
          <div className="flex gap8 wrapf">
            {company.availabilitySlots.map((s) => (
              <span key={s.id} className="tag">{DAY_LABELS[s.dayOfWeek]} {s.startTime}–{s.endTime}</span>
            ))}
          </div>
        </div>
      )}

      <div className="sectit" style={{ fontSize: 15, marginBottom: 10 }}>
        Вакансии {openRequests > 0 ? `· ${openRequests} сейчас открыто` : ""}
      </div>
      {visibleRequests.length === 0 && (
        <div className="card card-p mini muted">Компания пока не публиковала открытых вакансий.</div>
      )}
      <div style={{ display: "grid", gap: 10 }}>
        {visibleRequests.slice(0, 10).map((r) => {
          const st = STATUS_LABEL[r.status];
          return (
            <Link
              key={r.id}
              href={`/dashboard/requests/${r.id}`}
              className="card card-p card-hover"
              style={{ textDecoration: "none", color: "inherit", display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <div>
                <b className="mini" style={{ display: "block" }}>{r.title}</b>
                <span className="mini muted">{fmtSum(r.rewardGross)} · {r._count.candidates} кандидатов</span>
              </div>
              <span className={`pill ${st.c}`}>{st.t}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
