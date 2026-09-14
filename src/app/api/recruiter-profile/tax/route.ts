import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  isSelfEmployed: z.boolean(),
  taxId: z.string().max(20).optional(),
});

// POST /api/recruiter-profile/tax — отметка "я самозанятый" + ИНН/ПИНФЛ для отчётности
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.recruiterProfile.update({
    where: { id: user.recruiterProfile.id },
    data: {
      isSelfEmployed: parsed.data.isSelfEmployed,
      taxId: parsed.data.taxId || null,
    },
    select: { isSelfEmployed: true, taxId: true },
  });

  return NextResponse.json(updated);
}
