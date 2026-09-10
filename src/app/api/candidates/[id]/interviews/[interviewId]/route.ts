import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyCompany } from "@/lib/notify";

function fmtDateTime(d: Date) {
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const schema = z.object({
  status: z.enum(["SCHEDULED", "DONE", "CANCELLED"]).optional(),
  scheduledAt: z.string().min(1).optional(), // перенос на другое время
  format: z.string().max(40).optional(),
  location: z.string().max(300).optional(),
  notes: z.string().max(1000).optional(),
});

// PATCH /api/candidates/:id/interviews/:interviewId — рекрутер-владелец
// отменяет, переносит или помечает собеседование прошедшим.
export async function PATCH(
  req: Request,
  { params }: { params: { id: string; interviewId: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const interview = await prisma.interview.findUnique({
    where: { id: params.interviewId },
    include: {
      candidate: { include: { request: { select: { id: true, companyId: true, title: true } } } },
    },
  });
  if (!interview || interview.candidateId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (interview.candidate.recruiterId !== user.recruiterProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: any = {};
  if (parsed.data.status) data.status = parsed.data.status;
  if (parsed.data.scheduledAt) {
    const d = new Date(parsed.data.scheduledAt);
    if (Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Некорректная дата/время" }, { status: 400 });
    }
    data.scheduledAt = d;
    data.status = "SCHEDULED"; // перенос автоматически снимает отмену
  }
  if (parsed.data.format !== undefined) data.format = parsed.data.format;
  if (parsed.data.location !== undefined) data.location = parsed.data.location;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;

  const updated = await prisma.interview.update({
    where: { id: interview.id },
    data,
  });

  if (interview.candidate.request) {
    if (parsed.data.status === "CANCELLED") {
      await notifyCompany(
        interview.candidate.request.companyId,
        "INTERVIEW_CANCELLED",
        "Собеседование отменено",
        `${interview.candidate.name} по «${interview.candidate.request.title}» — собеседование ${fmtDateTime(interview.scheduledAt)} отменено`,
        `/dashboard/requests/${interview.candidate.request.id}`
      );
    } else if (parsed.data.scheduledAt) {
      await notifyCompany(
        interview.candidate.request.companyId,
        "INTERVIEW_SCHEDULED",
        "Собеседование перенесено",
        `${interview.candidate.name} по «${interview.candidate.request.title}» — новое время: ${fmtDateTime(updated.scheduledAt)}`,
        `/dashboard/requests/${interview.candidate.request.id}`
      );
    }
  }

  return NextResponse.json(updated);
}
