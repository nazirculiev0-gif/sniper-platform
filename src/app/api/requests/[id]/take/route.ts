import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// POST /api/requests/:id/take — рекрутер берёт заявку в работу
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const request = await prisma.vacancyRequest.findUnique({
    where: { id: params.id },
    include: { participants: true },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.moderation !== "APPROVED") {
    return NextResponse.json({ error: "Заявка ещё не прошла модерацию" }, { status: 400 });
  }
  if (request.status === "FILLED" || request.status === "CLOSED") {
    return NextResponse.json({ error: "Заявка уже закрыта" }, { status: 400 });
  }
  if (request.mode === "EXCLUSIVE" && request.participants.length > 0) {
    return NextResponse.json({ error: "Заявка эксклюзивная и уже взята" }, { status: 400 });
  }

  await prisma.requestParticipant.upsert({
    where: {
      requestId_recruiterId: {
        requestId: request.id,
        recruiterId: user.recruiterProfile.id,
      },
    },
    create: { requestId: request.id, recruiterId: user.recruiterProfile.id },
    update: {},
  });

  const updated = await prisma.vacancyRequest.update({
    where: { id: request.id },
    data: {
      status: "IN_PROGRESS",
      claimedAt: request.claimedAt ?? new Date(),
    },
    include: { participants: { include: { recruiter: true } } },
  });

  return NextResponse.json(updated);
}
