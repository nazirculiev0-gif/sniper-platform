import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// POST /api/requests/:id/simulate-idle — демо-кнопка: искусственно "состаривает"
// claimDeadline, чтобы на следующей загрузке страницы сработал releaseExpiredClaims()
// и заявка вернулась на биржу — без ожидания реальных 14 дней. Только для демонстрации.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.vacancyRequest.findUnique({ where: { id: params.id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isEmployer = user.role === "EMPLOYER" && request.companyId === user.company?.id;
  const isRecruiterOnIt =
    user.role === "RECRUITER" &&
    (await prisma.requestParticipant.findUnique({
      where: { requestId_recruiterId: { requestId: request.id, recruiterId: user.recruiterProfile?.id ?? "" } },
    }));
  if (!isEmployer && !isRecruiterOnIt) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (request.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Заявка не в статусе «В работе»" }, { status: 400 });
  }

  const updated = await prisma.vacancyRequest.update({
    where: { id: request.id },
    data: { claimDeadline: new Date(Date.now() - 1000) },
  });

  return NextResponse.json(updated);
}
