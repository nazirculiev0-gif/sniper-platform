import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyCompany } from "@/lib/notify";

const schema = z.object({ candidateId: z.string() });

// POST /api/requests/:id/candidates/from-base — переносит кандидата из личной
// базы рекрутера (requestId=null) в канбан текущей заявки.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isParticipant = await prisma.requestParticipant.findUnique({
    where: { requestId_recruiterId: { requestId: params.id, recruiterId: user.recruiterProfile.id } },
  });
  if (!isParticipant) {
    return NextResponse.json({ error: "Вы не участник этой заявки" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: parsed.data.candidateId } });
  if (!candidate || candidate.recruiterId !== user.recruiterProfile.id || candidate.requestId) {
    return NextResponse.json({ error: "Кандидат недоступен для добавления" }, { status: 400 });
  }

  const updated = await prisma.candidate.update({
    where: { id: candidate.id },
    data: { requestId: params.id, stage: "NEW" },
  });

  const request = await prisma.vacancyRequest.findUnique({
    where: { id: params.id },
    select: { companyId: true, title: true },
  });
  if (request) {
    await notifyCompany(
      request.companyId,
      "CANDIDATE_ADDED",
      "Новый кандидат по заявке",
      `${user.recruiterProfile.name} добавил кандидата ${updated.name} на «${request.title}»`,
      `/dashboard/requests/${params.id}`
    );
  }

  return NextResponse.json(updated, { status: 201 });
}
