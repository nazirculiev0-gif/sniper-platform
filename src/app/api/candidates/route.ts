import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  name: z.string().min(2),
  profession: z.string().optional(),
  skills: z.array(z.string()).default([]),
  expSalary: z.number().int().optional(),
  source: z.string().optional(),
  gender: z.enum(["M", "F"]).optional(),
  age: z.number().int().min(14).max(100).optional(),
  phone: z.string().max(30).optional(),
  desiredPositions: z.array(z.string()).default([]),
  industry: z.string().max(80).optional(),
  currentEmployer: z.string().max(120).optional(),
  searchStatus: z.enum(["active", "passive", "employed"]).optional(),
  resumeFileName: z.string().max(200).optional(),
  resumeFileType: z.string().max(100).optional(),
  resumeFileData: z.string().max(6_000_000, "Файл слишком большой (максимум ~4 МБ)").optional(),
});

// POST /api/candidates — рекрутер добавляет кандидата прямо в свою базу,
// без привязки к какой-либо заявке (requestId остаётся null).
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const candidate = await prisma.candidate.create({
    data: {
      ...parsed.data,
      recruiterId: user.recruiterProfile.id,
      requestId: null,
    },
  });

  return NextResponse.json(candidate, { status: 201 });
}
