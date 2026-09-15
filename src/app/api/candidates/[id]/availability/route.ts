import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/candidates/:id/availability — слоты доступности работодателя той заявки,
// к которой привязан кандидат. Нужно рекрутеру, чтобы предложить удобное время
// собеседования, не наугад.
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
  if (!candidate.request) {
    return NextResponse.json({ slots: [], calendar: [] });
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: { companyId: candidate.request.companyId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  // Строим почасовой календарь на ближайшие 14 дней по слотам доступности,
  // помечая часы, уже занятые запланированными собеседованиями этого работодателя
  // (по всем его кандидатам, не только текущему) — чтобы рекрутер не предлагал
  // время, которое уже закрыто другим интервью.
  const now = new Date();
  const windowStart = new Date(now);
  windowStart.setHours(0, 0, 0, 0);
  const windowEnd = new Date(windowStart.getTime() + 14 * 24 * 60 * 60 * 1000);

  const busyInterviews = await prisma.interview.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: windowStart, lt: windowEnd },
      candidate: { request: { companyId: candidate.request.companyId } },
    },
    select: { scheduledAt: true },
  });
  const busyTimestamps = new Set(busyInterviews.map((iv) => iv.scheduledAt.getTime()));

  const pad = (n: number) => String(n).padStart(2, "0");
  const calendar: { iso: string; date: string; start: string; end: string; busy: boolean }[] = [];

  for (let i = 0; i < 14; i++) {
    const day = new Date(windowStart.getTime() + i * 24 * 60 * 60 * 1000);
    const dow = day.getDay();
    const daySlots = slots.filter((s) => s.dayOfWeek === dow);

    for (const s of daySlots) {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      let cursor = new Date(day);
      cursor.setHours(sh, sm, 0, 0);
      const end = new Date(day);
      end.setHours(eh, em, 0, 0);

      while (cursor.getTime() + 60 * 60 * 1000 <= end.getTime()) {
        const slotStart = new Date(cursor);
        const slotEnd = new Date(cursor.getTime() + 60 * 60 * 1000);
        if (slotStart.getTime() > now.getTime()) {
          calendar.push({
            iso: slotStart.toISOString(),
            date: `${slotStart.getFullYear()}-${pad(slotStart.getMonth() + 1)}-${pad(slotStart.getDate())}`,
            start: `${pad(slotStart.getHours())}:${pad(slotStart.getMinutes())}`,
            end: `${pad(slotEnd.getHours())}:${pad(slotEnd.getMinutes())}`,
            busy: busyTimestamps.has(slotStart.getTime()),
          });
        }
        cursor = new Date(cursor.getTime() + 60 * 60 * 1000);
      }
    }
  }

  return NextResponse.json({ slots, calendar });
}
