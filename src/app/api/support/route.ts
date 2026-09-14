import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyAdmins } from "@/lib/notify";

// GET /api/support — своя переписка с поддержкой (создаёт пустой ответ, если треда ещё нет)
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const thread = await prisma.supportThread.findUnique({
    where: { userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (thread) {
    const unreadIds = thread.messages.filter((m) => m.fromAdmin && !m.readByUser).map((m) => m.id);
    if (unreadIds.length > 0) {
      await prisma.supportMessage.updateMany({
        where: { id: { in: unreadIds } },
        data: { readByUser: true },
      });
    }
  }

  return NextResponse.json({
    status: thread?.status ?? null,
    messages: thread?.messages ?? [],
  });
}

const schema = z.object({ text: z.string().min(1).max(2000) });

// POST /api/support — отправить сообщение в поддержку (создаёт тред при первом обращении)
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const thread = await prisma.supportThread.upsert({
    where: { userId: user.id },
    create: { userId: user.id },
    update: { status: "OPEN" }, // новое сообщение переоткрывает закрытый тред
  });

  const message = await prisma.supportMessage.create({
    data: { threadId: thread.id, text: parsed.data.text, fromAdmin: false },
  });

  const displayName = user.company?.name ?? user.recruiterProfile?.name ?? user.email;
  const preview = parsed.data.text.length > 140 ? parsed.data.text.slice(0, 140) + "…" : parsed.data.text;
  await notifyAdmins(
    "SUPPORT_MESSAGE",
    "Новое сообщение в поддержку",
    `${displayName}: ${preview}`,
    "/dashboard/admin/support"
  );

  return NextResponse.json(message, { status: 201 });
}
