import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { TARIFFS, depositFor, EXCLUSIVE_DAYS, GUARANTEE_DAYS } from "@/lib/tariffs";
import { releaseExpiredClaims } from "@/lib/autoRelease";

// GET /api/requests
// - EMPLOYER: только свои заявки
// - RECRUITER: открытые + одобренные модерацией (биржа) + те, где он участник
// - ADMIN: всё
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await releaseExpiredClaims();

  let where: any = {};
  if (user.role === "EMPLOYER") {
    where = { companyId: user.company!.id };
  } else if (user.role === "RECRUITER") {
    where = {
      OR: [
        { status: { in: ["OPEN", "IN_PROGRESS"] }, moderation: "APPROVED" },
        { participants: { some: { recruiterId: user.recruiterProfile!.id } } },
      ],
    };
  }
  // ADMIN — без фильтра, видит всё

  const requests = await prisma.vacancyRequest.findMany({
    where,
    include: {
      company: true,
      participants: { include: { recruiter: true } },
      _count: { select: { candidates: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

const createSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  skills: z.array(z.string()).default([]),
  salaryFrom: z.number().int().optional(),
  salaryTo: z.number().int().optional(),
  mode: z.enum(["EXCLUSIVE", "OPEN"]).default("OPEN"),
  tariffCategory: z.enum(["JUNIOR", "MIDDLE", "SENIOR", "LEAD", "TOP_MANAGEMENT"]),
  guaranteeDays: z.number().int().default(GUARANTEE_DAYS),
});

// POST /api/requests — только работодатель.
// Тариф берётся из фиксированной сетки по категории, депозит = 15% и считается
// внесённым сразу (эмуляция оплаты — в реальной системе здесь вызов Payme/Click).
// После оплаты депозита заявка уходит на модерацию.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tariff = TARIFFS[parsed.data.tariffCategory];
  const deposit = depositFor(tariff.amount);

  const request = await prisma.vacancyRequest.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      skills: parsed.data.skills,
      salaryFrom: parsed.data.salaryFrom,
      salaryTo: parsed.data.salaryTo,
      mode: parsed.data.mode,
      tariffCategory: parsed.data.tariffCategory,
      rewardGross: tariff.amount,
      depositAmount: deposit,
      depositPaid: true, // симуляция мгновенной оплаты депозита
      exclusiveDays: EXCLUSIVE_DAYS,
      guaranteeDays: parsed.data.guaranteeDays,
      companyId: user.company!.id,
      status: "MODERATION",
      moderation: "PENDING",
    },
  });

  return NextResponse.json(request, { status: 201 });
}
