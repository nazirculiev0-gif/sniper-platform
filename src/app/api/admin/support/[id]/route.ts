import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyUser } from "@/lib/notify";

// GET /api/admin/support/:id — полная переписка + отметка прочитанным со стороны админа
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thread = await prisma.supportThread.findUnique({
    where: { id: params.id },
    include: {
      user: { include: { company: true, recruiterProfile: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const unreadIds = thread.messages.filter((m) => !m.fromAdmin && !m.readByAdmin).map((m) => m.id);
  if (unreadIds.length > 0) {
    await prisma.supportMessage.updateMany({
      where: { id: { in: unreadIds } },
      data: { readByAdmin: true },
    });
  }

  return NextResponse.json(thread);
}

const messageSchema = z.object({ text: z.string().min(1).max(2000) });

// POST /api/admin/support/:id — ответ администратора пользователю
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const thread = await prisma.supportThread.findUnique({ where: { id: params.id } });
  if (!thread) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const parsed = messageSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [message] = await prisma.$transaction([
    prisma.supportMessage.create({
      data: { threadId: thread.id, text: parsed.data.text, fromAdmin: true },
    }),
    prisma.supportThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } }),
  ]);

  const preview = parsed.data.text.length > 140 ? parsed.data.text.slice(0, 140) + "…" : parsed.data.text;
  await notifyUser(thread.userId, "SUPPORT_MESSAGE", "Ответ от поддержки SNIPER", preview, "/dashboard");

  return NextResponse.json(message, { status: 201 });
}

const statusSchema = z.object({ status: z.enum(["OPEN", "CLOSED"]) });

// PATCH /api/admin/support/:id — закрыть/переоткрыть обращение
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentUser();
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.supportThread.update({
    where: { id: params.id },
    data: { status: parsed.data.status },
  });

  return NextResponse.json(updated);
}
