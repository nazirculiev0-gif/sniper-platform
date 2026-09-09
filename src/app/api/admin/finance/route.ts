import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const payouts = await prisma.payout.findMany({
    include: { request: { include: { company: true } }, recruiter: true },
    orderBy: { hireDate: "desc" },
  });

  const gmv = payouts
    .filter((p) => p.status === "IN_ESCROW" || p.status === "RELEASED")
    .reduce((a, p) => a + p.gross, 0);
  const commissionEarned = payouts
    .filter((p) => p.status === "RELEASED")
    .reduce((a, p) => a + (p.commission ?? 0), 0);
  const inEscrow = payouts
    .filter((p) => p.status === "IN_ESCROW")
    .reduce((a, p) => a + (p.gross - (p.firstHalfReleasedAt ? Math.round((p.gross - (p.commission ?? 0)) / 2) : 0)), 0);

  return NextResponse.json({ gmv, commissionEarned, inEscrow, payouts });
}
