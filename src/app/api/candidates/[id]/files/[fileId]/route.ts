import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/candidates/:id/files/:fileId — полное содержимое файла (для просмотра/скачивания)
export async function GET(
  _req: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = await prisma.candidateFile.findUnique({
    where: { id: params.fileId },
    include: {
      candidate: { include: { request: { select: { companyId: true } } } },
    },
  });
  if (!file || file.candidateId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = user.role === "RECRUITER" && file.candidate.recruiterId === user.recruiterProfile?.id;
  const isEmployerOfRequest =
    user.role === "EMPLOYER" && file.candidate.request?.companyId === user.company?.id;
  if (!isOwner && !isEmployerOfRequest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(file);
}

// DELETE /api/candidates/:id/files/:fileId — рекрутер-владелец удаляет ошибочно загруженный файл
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; fileId: string } }
) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const file = await prisma.candidateFile.findUnique({
    where: { id: params.fileId },
    include: { candidate: true },
  });
  if (!file || file.candidateId !== params.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (file.candidate.recruiterId !== user.recruiterProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.candidateFile.delete({ where: { id: file.id } });
  return NextResponse.json({ ok: true });
}
