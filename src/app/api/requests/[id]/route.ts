import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const request = await prisma.vacancyRequest.findUnique({
    where: { id: params.id },
    include: {
      company: true,
      participants: { include: { recruiter: true } },
      candidates: {
        select: {
          id: true,
          name: true,
          profession: true,
          skills: true,
          expSalary: true,
          searchStatus: true,
          stage: true,
          createdAt: true,
          recruiterId: true,
          requestId: true,
          resumeFileName: true,
        },
      },
      questions: true,
      payout: true,
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isParticipant =
    user.role === "RECRUITER" &&
    request.participants.some((p) => p.recruiterId === user.recruiterProfile?.id);
  const isOwnerEmployer = user.role === "EMPLOYER" && request.companyId === user.company?.id;
  const isLiveOnExchange = request.moderation === "APPROVED" && (request.status === "OPEN" || request.status === "IN_PROGRESS");
  const canView =
    user.role === "ADMIN" || isOwnerEmployer || isParticipant || (user.role === "RECRUITER" && isLiveOnExchange);
  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(request);
}
