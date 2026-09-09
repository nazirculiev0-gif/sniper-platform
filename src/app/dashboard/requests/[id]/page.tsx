import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Kanban from "@/components/Kanban";
import AddCandidateForm from "@/components/AddCandidateForm";
import Chat from "@/components/Chat";
import ReviewForm from "@/components/ReviewForm";
import { TARIFFS } from "@/lib/tariffs";
import { releaseExpiredClaims } from "@/lib/autoRelease";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function daysLeft(deadline?: Date | null) {
  if (!deadline) return null;
  return Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;

  await releaseExpiredClaims();

  const request = await prisma.vacancyRequest.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      candidates: true,
      participants: { include: { recruiter: true } },
      payout: true,
      review: true,
    },
  });
  if (!request) notFound();

  const isParticipant =
    user.role === "RECRUITER" &&
    request.participants.some((p) => p.recruiterId === user.recruiterProfile?.id);

  const tariff = TARIFFS[request.tariffCategory as keyof typeof TARIFFS];
  const left = daysLeft(request.claimDeadline);

  return (
    <div>
      <div className="card card-p" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <b className="sg" style={{ fontSize: 18 }}>{request.title}</b>
            <div className="mini muted" style={{ marginTop: 4 }}>
              {request.company.name} · {tariff?.label ?? request.tariffCategory}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="sg" style={{ fontSize: 16, fontWeight: 700 }}>{fmtSum(request.rewardGross)}</div>
            <div className="mini muted">Гарантия {request.guaranteeDays} дн.</div>
          </div>
        </div>
        <p className="mini" style={{ marginTop: 12, lineHeight: 1.6 }}>{request.description}</p>

        <div className="flex gap8 wrapf" style={{ marginTop: 14 }}>
          {request.depositPaid && (
            <span className="pill pill-info">Депозит {fmtSum(request.depositAmount)} внесён</span>
          )}
          {request.status === "IN_PROGRESS" && left !== null && (
            <span className="pill pill-warn">
              {left <= 0 ? "Дедлайн закрепления сегодня" : `${left} дн. до автовозврата на биржу`}
            </span>
          )}
          {request.autoReleasedCount > 0 && (
            <span className="pill pill-mut">Автовозвращалась на биржу: {request.autoReleasedCount} раз</span>
          )}
        </div>

        {request.participants.length > 0 && (
          <div className="flex gap8 wrapf" style={{ marginTop: 12 }}>
            {request.participants.map((p) => (
              <Link
                key={p.recruiterId}
                href={`/dashboard/recruiters/${p.recruiterId}`}
                className="tag"
                style={{ textDecoration: "none" }}
              >
                Рекрутер: {p.recruiter.name} ★{p.recruiter.rating.toFixed(1)}
              </Link>
            ))}
          </div>
        )}
      </div>

      {user.role === "RECRUITER" && isParticipant && (
        <div style={{ marginBottom: 14 }}>
          <AddCandidateForm requestId={request.id} />
        </div>
      )}

      <Kanban
        requestId={request.id}
        candidates={JSON.parse(JSON.stringify(request.candidates))}
        role={user.role}
        canEdit={user.role === "RECRUITER" && isParticipant}
        canConfirmHire={user.role === "EMPLOYER"}
        payoutExists={!!request.payout}
      />

      {(user.role === "EMPLOYER" || isParticipant) && (
        <div style={{ marginTop: 18 }}>
          <div className="sectit" style={{ fontSize: 15, marginBottom: 10 }}>Чат по заявке</div>
          <Chat
            requestId={request.id}
            role={user.role}
            companyName={request.company.name}
            participants={JSON.parse(JSON.stringify(request.participants))}
          />
        </div>
      )}

      {user.role === "EMPLOYER" && request.status === "FILLED" && request.payout && (
        <div style={{ marginTop: 18 }}>
          <ReviewForm requestId={request.id} existing={request.review} />
        </div>
      )}
    </div>
  );
}
