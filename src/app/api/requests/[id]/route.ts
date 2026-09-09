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
      candidates: true,
      questions: true,
      payout: true,
    },
  });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(request);
}
