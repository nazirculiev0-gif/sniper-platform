import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/requests
// - EMPLOYER: только свои заявки
// - RECRUITER: открытые + одобренные модерацией (биржа) + те, где он участник
// - ADMIN: всё
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
  rewardGross: z.number().int().positive(),
  exclusiveDays: z.number().int().default(14),
  deadlineDays: z.number().int().default(45),
  guaranteeDays: z.number().int().default(30),
});

// POST /api/requests — только работодатель. Уходит на модерацию.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const request = await prisma.vacancyRequest.create({
    data: {
      ...parsed.data,
      companyId: user.company!.id,
      status: "MODERATION",
      moderation: "PENDING",
    },
  });

  return NextResponse.json(request, { status: 201 });
}
