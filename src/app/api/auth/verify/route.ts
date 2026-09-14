import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { notifyAdmins } from "@/lib/notify";

const schema = z.object({
  email: z.string().email(),
  code: z.string().min(6).max(6),
});

// POST /api/auth/verify — подтверждение email по 6-значному коду из письма
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: { recruiterProfile: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ ok: true, alreadyVerified: true });
  }
  if (!user.verificationCode || !user.verificationExpires) {
    return NextResponse.json({ error: "Код не запрашивался — запросите новый" }, { status: 400 });
  }
  if (user.verificationExpires < new Date()) {
    return NextResponse.json({ error: "Код истёк — запросите новый" }, { status: 400 });
  }
  if (user.verificationCode !== code) {
    return NextResponse.json({ error: "Неверный код" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { emailVerified: true, verificationCode: null, verificationExpires: null },
  });

  if (user.role === "RECRUITER" && user.recruiterProfile) {
    await notifyAdmins(
      "RECRUITER_REGISTERED",
      "Новый рекрутер зарегистрировался",
      `${user.recruiterProfile.name} ожидает верификации`,
      "/dashboard/admin/recruiters"
    );
  }

  return NextResponse.json({ ok: true });
}
