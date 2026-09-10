import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { commissionFor } from "@/lib/tariffs";
import { notifyRecruiter } from "@/lib/notify";

const schema = z.object({ candidateId: z.string() });

// POST /api/requests/:id/confirm-hire
// Работодатель подтверждает найм кандидата на этапе offer_accepted.
// Создаётся Payout: сумма уходит "в эскроу", комиссия фиксируется,
// гарантийный период = guaranteeDays от заявки.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.vacancyRequest.findUnique({ where: { id: params.id } });
  if (!request || request.companyId !== user.company.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const candidate = await prisma.candidate.findUnique({
    where: { id: parsed.data.candidateId },
  });
  if (!candidate || candidate.requestId !== request.id) {
    return NextResponse.json({ error: "Кандидат не найден в этой заявке" }, { status: 400 });
  }
  if (candidate.stage !== "OFFER_ACCEPTED") {
    return NextResponse.json(
      { error: "Кандидат должен быть на этапе «Оффер принят»" },
      { status: 400 }
    );
  }

  const commission = commissionFor(request.rewardGross);
  const guaranteeUntil = new Date();
  guaranteeUntil.setDate(guaranteeUntil.getDate() + request.guaranteeDays);

  const [payout] = await prisma.$transaction([
    prisma.payout.create({
      data: {
        requestId: request.id,
        recruiterId: candidate.recruiterId,
        gross: request.rewardGross,
        commission,
        status: "IN_ESCROW",
        guaranteeUntil,
      },
    }),
    prisma.candidate.update({
      where: { id: candidate.id },
      data: { stage: "HIRED" },
    }),
    prisma.vacancyRequest.update({
      where: { id: request.id },
      data: { status: "FILLED", hiredCandidateId: candidate.id },
    }),
  ]);

  await notifyRecruiter(
    candidate.recruiterId,
    "HIRE_CONFIRMED",
    "Наём подтверждён",
    `Работодатель подтвердил найм кандидата ${candidate.name} по «${request.title}» — вознаграждение ${request.rewardGross.toLocaleString("ru-RU")} сум`,
    `/dashboard/requests/${request.id}`
  );

  return NextResponse.json(payout, { status: 201 });
}
