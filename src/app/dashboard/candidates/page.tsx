import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import { bestMatch } from "@/lib/matching";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

export default async function RecruiterCandidatesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) return null;

  const [candidates, openRequests] = await Promise.all([
    prisma.candidate.findMany({
      where: { recruiterId: user.recruiterProfile.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.vacancyRequest.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] }, moderation: "APPROVED" },
    }),
  ]);

  return (
    <div>
      <div className="card-h" style={{ border: "none", padding: "0 0 10px" }}>
        <h3>Моя база кандидатов</h3>
        <div className="sub">{candidates.length} человек — сравнение с открытыми заявками биржи</div>
      </div>

      {candidates.length === 0 && <div className="card card-p mini muted">Пока нет кандидатов — добавьте их через страницу заявки.</div>}

      <div style={{ display: "grid", gap: 10 }}>
        {candidates.map((c) => {
          const match = bestMatch(c, openRequests);
          return (
            <div key={c.id} className="card card-p" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <b className="sg" style={{ fontSize: 14 }}>{c.name}</b>
                <div className="mini muted">{c.profession || "—"} · {fmtSum(c.expSalary)}</div>
              </div>
              {match ? (
                <span
                  className="match"
                  style={{
                    background: match.score >= 70 ? "var(--okbg)" : "var(--warnbg)",
                    color: match.score >= 70 ? "var(--ok)" : "var(--warn)",
                    padding: "4px 10px",
                    borderRadius: 99,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                  title={match.reasons.join("; ")}
                >
                  {match.score}% · {match.request.title}
                </span>
              ) : (
                <span className="mini muted">Нет подходящих заявок</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
