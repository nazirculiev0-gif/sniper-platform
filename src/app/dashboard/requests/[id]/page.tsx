import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/currentUser";
import { prisma } from "@/lib/prisma";
import Kanban from "@/components/Kanban";
import AddCandidateForm from "@/components/AddCandidateForm";

function fmtSum(n?: number | null) {
  if (!n) return "—";
  return n.toLocaleString("ru-RU") + " сум";
}

export default async function RequestDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const request = await prisma.vacancyRequest.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      candidates: true,
      participants: { include: { recruiter: true } },
      payout: true,
    },
  });
  if (!request) notFound();

  const isParticipant =
    user.role === "RECRUITER" &&
    request.participants.some((p) => p.recruiterId === user.recruiterProfile?.id);

  return (
    <div>
      <div className="card card-p" style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div>
            <b className="sg" style={{ fontSize: 18 }}>{request.title}</b>
            <div className="mini muted" style={{ marginTop: 4 }}>{request.company.name}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="sg" style={{ fontSize: 16, fontWeight: 700 }}>{fmtSum(request.rewardGross)}</div>
            <div className="mini muted">Гарантия {request.guaranteeDays} дн.</div>
          </div>
        </div>
        <p className="mini" style={{ marginTop: 12, lineHeight: 1.6 }}>{request.description}</p>
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
    </div>
  );
}
