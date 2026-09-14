import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  token: z.string().min(10),
  password: z.string().min(6),
});

// POST /api/auth/reset-password — задать новый пароль по токену из письма
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { token, password } = parsed.data;

  const user = await prisma.user.findFirst({ where: { resetToken: token } });
  if (!user || !user.resetTokenExpires) {
    return NextResponse.json({ error: "Ссылка недействительна — запросите новую" }, { status: 400 });
  }
  if (user.resetTokenExpires < new Date()) {
    return NextResponse.json({ error: "Ссылка истекла — запросите новую" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, resetToken: null, resetTokenExpires: null },
  });

  return NextResponse.json({ ok: true });
}
