import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyCompany } from "@/lib/notify";

// GET /api/candidates/:id — полная карточка кандидата, включая файл резюме.
// Доступно рекрутеру-владельцу или работодателю той заявки, к которой привязан кандидат.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { request: { select: { companyId: true } } },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = user.role === "RECRUITER" && candidate.recruiterId === user.recruiterProfile?.id;
  const isEmployerOfRequest =
    user.role === "EMPLOYER" && candidate.request?.companyId === user.company?.id;
  if (!isOwner && !isEmployerOfRequest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(candidate);
}

const schema = z.object({
  stage: z.enum([
    "NEW",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "OFFER_ACCEPTED",
    "HIRED",
    "REJECTED",
  ]).optional(),
  note: z.string().max(2000).optional(),
  name: z.string().min(2).optional(),
  profession: z.string().optional(),
  skills: z.array(z.string()).optional(),
  expSalary: z.number().int().optional(),
  gender: z.enum(["M", "F"]).optional(),
  age: z.number().int().min(14).max(100).optional(),
  phone: z.string().max(30).optional(),
  city: z.string().max(80).optional(),
  languages: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  willingToRelocate: z.boolean().optional(),
  desiredPositions: z.array(z.string()).optional(),
  industry: z.string().max(80).optional(),
  currentEmployer: z.string().max(120).optional(),
  searchStatus: z.enum(["active", "passive", "employed"]).optional(),
});

// PATCH /api/candidates/:id — рекрутер-владелец редактирует профиль кандидата
// целиком (любое подмножество полей), меняет этап канбана и/или заметку.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { request: { select: { id: true, companyId: true, title: true } } },
  });
  if (!candidate || candidate.recruiterId !== user.recruiterProfile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.candidate.update({
    where: { id: params.id },
    data: parsed.data,
  });

  if (parsed.data.stage === "INTERVIEW" && candidate.stage !== "INTERVIEW" && candidate.request) {
    await notifyCompany(
      candidate.request.companyId,
      "INTERVIEW_SCHEDULED",
      "Назначено собеседование",
      `Кандидат ${candidate.name} приглашён на собеседование по «${candidate.request.title}»`,
      `/dashboard/requests/${candidate.request.id}`
    );
  }

  return NextResponse.json(updated);
}
