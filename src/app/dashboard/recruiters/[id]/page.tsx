import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function Stars({ n }: { n: number }) {
  return (
    <span style={{ color: "#E5A100", fontSize: 15, letterSpacing: 1 }}>
      {"★".repeat(Math.round(n))}
      <span style={{ color: "var(--line)" }}>{"★".repeat(5 - Math.round(n))}</span>
    </span>
  );
}

export default async function RecruiterPublicProfile({ params }: { params: { id: string } }) {
  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: params.id },
    include: {
      reviews: { orderBy: { createdAt: "desc" }, include: { request: { include: { company: true } } } },
      payoutsAsRecruiter: { where: { status: "RELEASED" } },
      participations: { include: { request: true } },
    },
  });
  if (!recruiter) notFound();

  const closedCount = recruiter.payoutsAsRecruiter.length;
  const totalEarned = recruiter.payoutsAsRecruiter.reduce((a, p) => a + (p.gross - (p.commission ?? 0)), 0);
  const claimedCount = recruiter.participations.length;
  const conversionRate = claimedCount > 0 ? Math.round((closedCount / claimedCount) * 100) : 0;

  return (
    <div>
      <div className="card card-p" style={{ marginBottom: 18 }}>
        <div className="flex gap8" style={{ alignItems: "center" }}>
          <div
            className="av"
            style={{ width: 56, height: 56, fontSize: 20, background: "var(--red)" }}
          >
            {recruiter.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}
          </div>
          <div style={{ flex: 1 }}>
            <div className="flex gap8" style={{ alignItems: "center" }}>
              <b className="sg" style={{ fontSize: 18 }}>{recruiter.name}</b>
              {recruiter.verified && <span className="pill pill-ok">Верифицирован</span>}
              <span className="pill pill-mut">{recruiter.type === "AGENCY" ? "Агентство" : "Соло-рекрутер"}</span>
            </div>
            <div className="flex gap8" style={{ marginTop: 4, alignItems: "center" }}>
              <Stars n={recruiter.rating} />
              <span className="mini muted">{recruiter.rating.toFixed(1)} · {recruiter.reviews.length} отзывов</span>
            </div>
          </div>
        </div>
        {recruiter.bio && <p className="mini" style={{ marginTop: 14, lineHeight: 1.6 }}>{recruiter.bio}</p>}
        {(recruiter.specializations.length > 0 || recruiter.regions.length > 0) && (
          <div className="flex gap8 wrapf" style={{ marginTop: 12 }}>
            {recruiter.specializations.map((s) => <span key={s} className="tag">{s}</span>)}
            {recruiter.regions.map((r) => <span key={r} className="tag">{r}</span>)}
          </div>
        )}
      </div>

      <div className="grid-kpi" style={{ marginBottom: 18 }}>
        <div className="kpi">
          <div className="n" style={{ fontSize: 22 }}>{closedCount}</div>
          <div className="l">Закрытых вакансий</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 22 }}>{conversionRate}%</div>
          <div className="l">Конверсия закреплений</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 20 }}>{fmtSum(totalEarned)}</div>
          <div className="l">Заработано на платформе</div>
        </div>
        <div className="kpi">
          <div className="n" style={{ fontSize: 22 }}>{recruiter.yearsExperience ?? "—"}</div>
          <div className="l">Лет в рекрутинге</div>
        </div>
      </div>

      <div className="sectit" style={{ fontSize: 15, marginBottom: 10 }}>Отзывы работодателей</div>
      {recruiter.reviews.length === 0 && (
        <div className="card card-p mini muted">Пока нет отзывов — появятся после первых закрытых вакансий.</div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 24, alignItems: "start" }}>
        {recruiter.reviews.map((r) => (
          <div key={r.id} className="card card-p">
            <div className="flex" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <b className="mini">{r.request.company.name}</b>
              <Stars n={r.rating} />
            </div>
            <div className="mini muted">{r.request.title}</div>
            {r.text && <p className="mini" style={{ marginTop: 8, lineHeight: 1.5 }}>{r.text}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
