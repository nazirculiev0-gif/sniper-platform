import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyCompany } from "@/lib/notify";

function fmtDateTime(d: Date) {
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// GET /api/candidates/:id/interviews — список собеседований кандидата
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { request: { select: { companyId: true } } },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = user.role === "RECRUITER" && candidate.recruiterId === user.recruiterProfile?.id;
  const isEmployerOfRequest = user.role === "EMPLOYER" && candidate.request?.companyId === user.company?.id;
  if (!isOwner && !isEmployerOfRequest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interviews = await prisma.interview.findMany({
    where: { candidateId: params.id },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json(interviews);
}

const schema = z.object({
  scheduledAt: z.string().datetime().or(z.string().min(1)), // ISO-строка из <input type="datetime-local">
  format: z.string().max(40).optional(),
  location: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

// POST /api/candidates/:id/interviews — рекрутер назначает собеседование.
// Если кандидат ещё на раннем этапе (NEW/SCREENING), этап поднимается до INTERVIEW.
export async function POST(req: Request, { params }: { params: { id: string } }) {
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

  const scheduledAt = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "Некорректная дата/время" }, { status: 400 });
  }

  const interview = await prisma.interview.create({
    data: {
      candidateId: candidate.id,
      scheduledAt,
      format: parsed.data.format,
      location: parsed.data.location,
      notes: parsed.data.notes,
    },
  });

  if (candidate.stage === "NEW" || candidate.stage === "SCREENING") {
    await prisma.candidate.update({ where: { id: candidate.id }, data: { stage: "INTERVIEW" } });
  }

  if (candidate.request) {
    await notifyCompany(
      candidate.request.companyId,
      "INTERVIEW_SCHEDULED",
      "Назначено собеседование",
      `${candidate.name} по «${candidate.request.title}» — ${fmtDateTime(scheduledAt)}${parsed.data.format ? ` · ${parsed.data.format}` : ""}`,
      `/dashboard/requests/${candidate.request.id}`
    );
  }

  return NextResponse.json(interview, { status: 201 });
}
