import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

// POST /api/auth/forgot-password — отправляет ссылку для сброса пароля.
// Всегда отвечает ok — не выдаём, существует ли такой email в системе.
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000) },
    });

    const origin = new URL(req.url).origin;
    const resetUrl = `${origin}/reset-password?token=${token}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return NextResponse.json({ ok: true });
}
