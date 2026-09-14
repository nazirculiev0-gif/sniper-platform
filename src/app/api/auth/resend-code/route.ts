import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, generateVerificationCode } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

// POST /api/auth/resend-code — повторно выслать код подтверждения
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Не подтверждаем/опровергаем существование email — просто отвечаем ok в обоих случаях.
  if (!user || user.emailVerified) {
    return NextResponse.json({ ok: true });
  }

  const code = generateVerificationCode();
  await prisma.user.update({
    where: { id: user.id },
    data: { verificationCode: code, verificationExpires: new Date(Date.now() + 15 * 60 * 1000) },
  });
  await sendVerificationEmail(user.email, code);

  return NextResponse.json({ ok: true });
}
