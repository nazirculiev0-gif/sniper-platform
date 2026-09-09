import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["EMPLOYER", "RECRUITER"]),
  name: z.string().min(2), // название компании или имя рекрутера
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, password, role, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      ...(role === "EMPLOYER"
        ? { company: { create: { name } } }
        : { recruiterProfile: { create: { name } } }),
    },
  });

  return NextResponse.json({ id: user.id, email: user.email, role: user.role });
}
