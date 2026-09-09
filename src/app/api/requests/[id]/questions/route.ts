import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/requests/:id/questions — доступно всем авторизованным
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const questions = await prisma.question.findMany({
    where: { requestId: params.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(questions);
}

const schema = z.object({ text: z.string().min(1).max(1000) });

// POST /api/requests/:id/questions — рекрутер спрашивает, работодатель отвечает.
// Хронологическая публичная лента, видна всем на бирже.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "EMPLOYER" && user.role !== "RECRUITER")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (user.role === "EMPLOYER") {
    const request = await prisma.vacancyRequest.findUnique({ where: { id: params.id } });
    if (!request || request.companyId !== user.company?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const question = await prisma.question.create({
    data: { requestId: params.id, text: parsed.data.text, fromRole: user.role },
  });

  return NextResponse.json(question, { status: 201 });
}
