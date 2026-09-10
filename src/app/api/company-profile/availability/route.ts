import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// GET /api/company-profile/availability — свои слоты (для редактирования)
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: { companyId: user.company.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}

const schema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_RE, "Формат времени — ЧЧ:ММ"),
  endTime: z.string().regex(TIME_RE, "Формат времени — ЧЧ:ММ"),
});

// POST /api/company-profile/availability — добавить слот доступности
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.startTime >= parsed.data.endTime) {
    return NextResponse.json({ error: "Время начала должно быть раньше времени конца" }, { status: 400 });
  }

  const slot = await prisma.availabilitySlot.create({
    data: { ...parsed.data, companyId: user.company.id },
  });

  return NextResponse.json(slot, { status: 201 });
}
