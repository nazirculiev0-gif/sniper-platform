import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/candidates/base — кандидаты рекрутера, ещё не привязанные ни к одной заявке.
// Используется в модалке "Добавить кандидата → Из моей базы".
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidates = await prisma.candidate.findMany({
    where: { recruiterId: user.recruiterProfile.id, requestId: null },
    select: {
      id: true,
      name: true,
      profession: true,
      skills: true,
      expSalary: true,
      searchStatus: true,
      source: true,
      stage: true,
      note: true,
      createdAt: true,
      recruiterId: true,
      requestId: true,
      resumeFileName: true,
      resumeFileType: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(candidates);
}
