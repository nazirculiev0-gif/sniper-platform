import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

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
});

// PATCH /api/candidates/:id — сменить этап канбана и/или сохранить заметку
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
  if (!candidate || candidate.recruiterId !== user.recruiterProfile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.stage === undefined && parsed.data.note === undefined) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const updated = await prisma.candidate.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.stage !== undefined ? { stage: parsed.data.stage } : {}),
      ...(parsed.data.note !== undefined ? { note: parsed.data.note } : {}),
    },
  });

  return NextResponse.json(updated);
}
