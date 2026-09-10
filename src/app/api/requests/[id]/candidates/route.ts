import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyCompany } from "@/lib/notify";

const schema = z.object({
  name: z.string().min(2),
  profession: z.string().optional(),
  skills: z.array(z.string()).default([]),
  expSalary: z.number().int().optional(),
  source: z.string().optional(),
  stage: z.enum(["NEW", "SCREENING", "INTERVIEW", "OFFER", "OFFER_ACCEPTED"]).default("NEW"),
  resumeFileName: z.string().max(200).optional(),
  resumeFileType: z.string().max(100).optional(),
  resumeFileData: z.string().max(6_000_000, "Файл слишком большой (максимум ~4 МБ)").optional(),
});

// POST /api/requests/:id/candidates — рекрутер добавляет кандидата в канбан заявки
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isParticipant = await prisma.requestParticipant.findUnique({
    where: {
      requestId_recruiterId: {
        requestId: params.id,
        recruiterId: user.recruiterProfile.id,
      },
    },
  });
  if (!isParticipant) {
    return NextResponse.json({ error: "Вы не участник этой заявки" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const candidate = await prisma.candidate.create({
    data: {
      ...parsed.data,
      recruiterId: user.recruiterProfile.id,
      requestId: params.id,
    },
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
      `${user.recruiterProfile.name} добавил кандидата ${candidate.name} на «${request.title}»`,
      `/dashboard/requests/${params.id}`
    );
  }

  return NextResponse.json(candidate, { status: 201 });
}
