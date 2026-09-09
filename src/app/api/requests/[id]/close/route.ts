import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({ reason: z.string().max(500).optional() });

// POST /api/requests/:id/close — работодатель закрывает/отзывает заявку.
// Депозит возвращается полностью (depositRefundedAt), только если заявку ещё
// не закрепил ни один рекрутер (status === "OPEN"). Если уже "В работе" —
// депозит остаётся у платформы как компенсация уже потраченного времени рекрутера.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.vacancyRequest.findUnique({ where: { id: params.id } });
  if (!request || request.companyId !== user.company.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.status === "FILLED" || request.status === "CLOSED") {
    return NextResponse.json({ error: "Заявка уже закрыта" }, { status: 400 });
  }

  const canRefund = request.status === "OPEN" || request.status === "MODERATION";

  const updated = await prisma.vacancyRequest.update({
    where: { id: request.id },
    data: {
      status: "CLOSED",
      depositRefundedAt: canRefund && request.depositPaid ? new Date() : undefined,
    },
  });

  return NextResponse.json({
    ...updated,
    refunded: canRefund && request.depositPaid,
  });
}
