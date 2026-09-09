import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const requests = await prisma.vacancyRequest.findMany({
    include: { company: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}
