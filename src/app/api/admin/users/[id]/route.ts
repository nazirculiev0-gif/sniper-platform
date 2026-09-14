import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(120).optional(),
  isBlocked: z.boolean().optional(),
});

// PATCH /api/admin/users/:id — админ редактирует email/имя или меняет блокировку.
// "name" пишется в company.name или recruiterProfile.name в зависимости от роли пользователя.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    include: { company: true, recruiterProfile: true },
  });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { email, name, isBlocked } = parsed.data;

  if (isBlocked !== undefined) {
    if (target.role === "ADMIN") {
      return NextResponse.json({ error: "Нельзя заблокировать администратора" }, { status: 400 });
    }
    if (target.id === admin.id) {
      return NextResponse.json({ error: "Нельзя заблокировать самого себя" }, { status: 400 });
    }
  }

  if (email && email !== target.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Этот email уже используется другим пользователем" }, { status: 409 });
    }
  }

  await prisma.user.update({
    where: { id: target.id },
    data: {
      ...(email ? { email } : {}),
      ...(isBlocked !== undefined ? { isBlocked } : {}),
    },
  });

  if (name) {
    if (target.role === "EMPLOYER" && target.company) {
      await prisma.company.update({ where: { id: target.company.id }, data: { name } });
    } else if (target.role === "RECRUITER" && target.recruiterProfile) {
      await prisma.recruiterProfile.update({ where: { id: target.recruiterProfile.id }, data: { name } });
    }
  }

  return NextResponse.json({ ok: true });
}

// DELETE /api/admin/users/:id — безвозвратно удаляет пользователя и все связанные данные
// (компанию/профиль рекрутера, заявки, кандидатов, платежи — каскадом по схеме БД).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (params.id === admin.id) {
    return NextResponse.json({ error: "Нельзя удалить самого себя" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Нельзя удалить администратора" }, { status: 400 });
  }

  await prisma.user.delete({ where: { id: target.id } });
  return NextResponse.json({ ok: true });
}
