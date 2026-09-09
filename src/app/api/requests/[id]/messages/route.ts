import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/requests/:id/messages?recruiterId=xxx
// Работодатель указывает recruiterId (может общаться с несколькими).
// Рекрутер видит только свой тред (recruiterId = он сам).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  let recruiterId = url.searchParams.get("recruiterId");

  if (user.role === "RECRUITER") {
    if (!user.recruiterProfile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    recruiterId = user.recruiterProfile.id;
  }
  if (!recruiterId) {
    return NextResponse.json({ error: "recruiterId обязателен" }, { status: 400 });
  }

  const messages = await prisma.message.findMany({
    where: { requestId: params.id, recruiterId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

const sendSchema = z.object({
  text: z.string().min(1).max(2000),
  recruiterId: z.string().optional(), // обязателен, когда отправляет работодатель
});

// POST /api/requests/:id/messages
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "EMPLOYER" && user.role !== "RECRUITER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = sendSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let recruiterId: string;
  if (user.role === "RECRUITER") {
    if (!user.recruiterProfile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    recruiterId = user.recruiterProfile.id;

    const isParticipant = await prisma.requestParticipant.findUnique({
      where: { requestId_recruiterId: { requestId: params.id, recruiterId } },
    });
    if (!isParticipant) {
      return NextResponse.json({ error: "Вы не участник этой заявки" }, { status: 403 });
    }
  } else {
    if (!parsed.data.recruiterId) {
      return NextResponse.json({ error: "recruiterId обязателен для работодателя" }, { status: 400 });
    }
    recruiterId = parsed.data.recruiterId;

    const request = await prisma.vacancyRequest.findUnique({ where: { id: params.id } });
    if (!request || request.companyId !== user.company?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const message = await prisma.message.create({
    data: {
      requestId: params.id,
      recruiterId,
      text: parsed.data.text,
      fromRole: user.role,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
