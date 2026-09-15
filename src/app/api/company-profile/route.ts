import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  name: z.string().min(2).max(120),
  industry: z.string().max(80).optional(),
  logoData: z.string().max(1_500_000, "Файл слишком большой (максимум ~1 МБ)").optional(),
  logoType: z.string().max(100).optional(),
});

// PATCH /api/company-profile — работодатель редактирует свою компанию
// (название, отрасль, логотип). Виден рекрутерам на публичном профиле компании.
export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.company.update({
    where: { id: user.company.id },
    data: {
      name: parsed.data.name,
      industry: parsed.data.industry || null,
      ...(parsed.data.logoData ? { logoData: parsed.data.logoData, logoType: parsed.data.logoType } : {}),
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/company-profile — открепить логотип компании
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.company.update({
    where: { id: user.company.id },
    data: { logoData: null, logoType: null },
  });

  return NextResponse.json({ ok: true });
}
