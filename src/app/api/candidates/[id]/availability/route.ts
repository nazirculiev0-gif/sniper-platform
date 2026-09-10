import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/candidates/:id/availability — слоты доступности работодателя той заявки,
// к которой привязан кандидат. Нужно рекрутеру, чтобы предложить удобное время
// собеседования, не наугад.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const candidate = await prisma.candidate.findUnique({
    where: { id: params.id },
    include: { request: { select: { companyId: true } } },
  });
  if (!candidate) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = user.role === "RECRUITER" && candidate.recruiterId === user.recruiterProfile?.id;
  const isEmployerOfRequest = user.role === "EMPLOYER" && candidate.request?.companyId === user.company?.id;
  if (!isOwner && !isEmployerOfRequest) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!candidate.request) {
    return NextResponse.json([]);
  }

  const slots = await prisma.availabilitySlot.findMany({
    where: { companyId: candidate.request.companyId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(slots);
}
