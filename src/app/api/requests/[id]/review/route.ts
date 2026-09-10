import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyRecruiter } from "@/lib/notify";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().max(1000).optional(),
});

// POST /api/requests/:id/review — работодатель оставляет отзыв рекрутеру.
// Разрешено только после найма (status FILLED, есть hiredCandidateId).
// После сохранения пересчитывается средний рейтинг рекрутера.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.vacancyRequest.findUnique({
    where: { id: params.id },
    include: { payout: true },
  });
  if (!request || request.companyId !== user.company.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.status !== "FILLED" || !request.payout) {
    return NextResponse.json({ error: "Отзыв доступен только после подтверждённого найма" }, { status: 400 });
  }

  const review = await prisma.review.upsert({
    where: { requestId: request.id },
    create: {
      requestId: request.id,
      recruiterId: request.payout.recruiterId,
      rating: parsed.data.rating,
      text: parsed.data.text,
    },
    update: {
      rating: parsed.data.rating,
      text: parsed.data.text,
    },
  });

  const agg = await prisma.review.aggregate({
    where: { recruiterId: request.payout.recruiterId },
    _avg: { rating: true },
  });

  await prisma.recruiterProfile.update({
    where: { id: request.payout.recruiterId },
    data: { rating: agg._avg.rating ?? 0 },
  });

  await notifyRecruiter(
    request.payout.recruiterId,
    "REVIEW_RECEIVED",
    "Новый отзыв о вас",
    `${parsed.data.rating}★ по заявке «${request.title}»`,
    `/dashboard/recruiters/${request.payout.recruiterId}`
  );

  return NextResponse.json(review, { status: 201 });
}
