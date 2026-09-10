import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  name: z.string().min(2).max(120),
  industry: z.string().max(80).optional(),
});

// PATCH /api/company-profile — работодатель редактирует свою компанию
// (название, отрасль). Виден рекрутерам на публичном профиле компании.
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
    },
  });

  return NextResponse.json(updated);
}
