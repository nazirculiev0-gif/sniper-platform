import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Kanban from "@/components/Kanban";
import AddCandidateButton from "@/components/AddCandidateButton";
import Chat from "@/components/Chat";
import ReviewForm from "@/components/ReviewForm";
import QATab from "@/components/QATab";
import CloseRequestButton from "@/components/CloseRequestButton";
import RequestTabs from "@/components/RequestTabs";
import RequestSidePanel from "@/components/RequestSidePanel";
import { TARIFFS } from "@/lib/tariffs";
import { releaseExpiredClaims } from "@/lib/autoRelease";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("ru-RU");
}

const STATUS_LABEL: Record<string, { t: string; c: string }> = {
  DRAFT: { t: "Черновик", c: "pill-mut" },
  MODERATION: { t: "На модерации", c: "pill-warn" },
  OPEN: { t: "На бирже", c: "pill-ok" },
  IN_PROGRESS: { t: "В работе", c: "pill-info" },
  FILLED: { t: "Найм закрыт", c: "pill-ok" },
  CLOSED: { t: "Закрыта", c: "pill-mut" },
};

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
  const st = STATUS_LABEL[request.status];
  const canEditKanban = user.role === "RECRUITER" && isParticipant;
  const showChat = user.role === "EMPLOYER" || isParticipant;

  const overview = (
    <div className="card card-p">
      <div className="sectit" style={{ fontSize: 14, marginBottom: 10 }}>Описание</div>
      <p className="mini" style={{ lineHeight: 1.7, marginBottom: 18 }}>{request.description}</p>
      {request.skills.length > 0 && (
        <>
          <div className="sectit" style={{ fontSize: 14, marginBottom: 10 }}>Ключевые навыки</div>
          <div className="flex gap8 wrapf">
            {request.skills.map((s) => <span key={s} className="tag">{s}</span>)}
          </div>
        </>
      )}
    </div>
  );

  const questions = <QATab requestId={request.id} role={user.role} />;

  const candidates = (
    <Kanban
      requestId={request.id}
      candidates={JSON.parse(JSON.stringify(request.candidates))}
      role={user.role}
      canEdit={canEditKanban}
      canConfirmHire={user.role === "EMPLOYER"}
      payoutExists={!!request.payout}
      addButton={canEditKanban ? <AddCandidateButton requestId={request.id} /> : undefined}
    />
  );

  const chat = showChat ? (
    <Chat
      requestId={request.id}
      role={user.role}
      companyName={request.company.name}
      participants={JSON.parse(JSON.stringify(request.participants))}
    />
  ) : null;

  return (
    <div>
      <div className="flex" style={{ justifyContent: "space-between", marginBottom: 4 }}>
        <div>
          <h1 className="sg" style={{ fontSize: 20, fontWeight: 700 }}>{request.title}</h1>
          <div className="mini muted" style={{ marginTop: 2 }}>
            {request.company.name} · {tariff?.label} · Ташкент
          </div>
        </div>
        {user.role === "EMPLOYER" && request.status !== "FILLED" && request.status !== "CLOSED" && (
          <CloseRequestButton requestId={request.id} />
        )}
      </div>

      <div className="flex gap8 wrapf" style={{ margin: "14px 0 24px" }}>
        <span className={`pill ${st.c}`}>{st.t}</span>
        {request.mode === "EXCLUSIVE" && <span className="pill pill-red">Эксклюзив</span>}
        {request.depositPaid && <span className="pill pill-ok">Депозит внесён · без задержек</span>}
        {request.status === "IN_PROGRESS" && (
          <span className="pill pill-warn">
            {request.exclusiveDays} дн. эксклюзива
          </span>
        )}
        {request.autoReleasedCount > 0 && (
          <span className="pill pill-mut">Автовозврат: {request.autoReleasedCount}</span>
        )}
      </div>
      <div className="mini muted" style={{ marginTop: -16, marginBottom: 20 }}>
        Опубликовано {fmtDate(request.createdAt)} · ЗП {fmtSum(request.salaryFrom)} – {fmtSum(request.salaryTo)}
      </div>

      <div className="request-layout" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 24, alignItems: "start" }}>
        <RequestTabs
          overview={overview}
          questions={questions}
          questionsCount={0}
          candidates={candidates}
          candidatesCount={request.candidates.length}
          chat={chat}
          showChat={!!showChat}
        />

        <RequestSidePanel
          requestId={request.id}
          rewardGross={request.rewardGross}
          exclusiveDays={request.exclusiveDays}
          claimedAt={request.claimedAt?.toISOString() ?? null}
          claimDeadline={request.claimDeadline?.toISOString() ?? null}
          createdAt={request.createdAt.toISOString()}
          participants={JSON.parse(JSON.stringify(request.participants))}
          status={request.status}
          canSimulate={user.role === "EMPLOYER" || isParticipant}
        />
      </div>

      {user.role === "EMPLOYER" && request.status === "FILLED" && request.payout && (
        <div style={{ marginTop: 24 }}>
          <ReviewForm requestId={request.id} existing={request.review} />
        </div>
      )}
    </div>
  );
}
