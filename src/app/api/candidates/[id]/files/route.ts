import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

async function canAccessCandidate(userId_role: { role: string; recruiterProfileId?: string; companyId?: string }, candidate: any) {
  const isOwner = userId_role.role === "RECRUITER" && candidate.recruiterId === userId_role.recruiterProfileId;
  const isEmployerOfRequest = userId_role.role === "EMPLOYER" && candidate.request?.companyId === userId_role.companyId;
  return isOwner || isEmployerOfRequest;
}

// GET /api/candidates/:id/files — список файлов кандидата (без содержимого — только метаданные)
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { request: { select: { companyId: true } } },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed = await canAccessCandidate(
    { role: user.role, recruiterProfileId: user.recruiterProfile?.id, companyId: user.company?.id },
    candidate
  );
  if (!allowed) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const files = await prisma.candidateFile.findMany({
    where: { candidateId: params.id },
    select: { id: true, fileName: true, fileType: true, category: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(files);
}

const schema = z.object({
  fileName: z.string().min(1).max(200),
  fileType: z.string().max(100).optional(),
  fileData: z.string().max(6_000_000, "Файл слишком большой (максимум ~4 МБ)"),
  category: z.enum(["RESUME", "OTHER"]).default("OTHER"),
});

// POST /api/candidates/:id/files — рекрутер дозагружает файл (резюме или другой) уже созданному кандидату
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
  if (!candidate || candidate.recruiterId !== user.recruiterProfile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const file = await prisma.candidateFile.create({
    data: {
      candidateId: params.id,
      fileName: parsed.data.fileName,
      fileType: parsed.data.fileType,
      fileData: parsed.data.fileData,
      category: parsed.data.category,
    },
    select: { id: true, fileName: true, fileType: true, category: true, createdAt: true },
  });

  return NextResponse.json(file, { status: 201 });
}
