import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({ half: z.enum(["first", "second"]) });

// POST /api/payouts/:id/release — только ADMIN.
// Сплит 50/50: первая половина сразу после найма, вторая — после гарантийного периода.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const payout = await prisma.payout.findUnique({ where: { id: params.id } });
  if (!payout) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payout.status !== "IN_ESCROW") {
    return NextResponse.json({ error: "Платёж не в статусе эскроу" }, { status: 400 });
  }

  const net = payout.gross - (payout.commission ?? 0);
  const half = Math.round(net / 2);

  if (parsed.data.half === "second" && !payout.firstHalfReleasedAt) {
    return NextResponse.json({ error: "Сначала выплатите первую половину" }, { status: 400 });
  }
  if (parsed.data.half === "second" && payout.guaranteeUntil && payout.guaranteeUntil > new Date()) {
    return NextResponse.json({ error: "Гарантийный период ещё не закончился" }, { status: 400 });
  }

  const data: any =
    parsed.data.half === "first"
      ? { firstHalfReleasedAt: new Date() }
      : { secondHalfReleasedAt: new Date(), status: "RELEASED" };

  const [updatedPayout] = await prisma.$transaction([
    prisma.payout.update({ where: { id: payout.id }, data }),
    prisma.recruiterProfile.update({
      where: { id: payout.recruiterId },
      data: { balance: { increment: half } },
    }),
  ]);

  return NextResponse.json(updatedPayout);
}
