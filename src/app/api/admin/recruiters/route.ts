import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const recruiters = await prisma.recruiterProfile.findMany({
    include: { user: true, _count: { select: { candidates: true, participations: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(recruiters);
}
