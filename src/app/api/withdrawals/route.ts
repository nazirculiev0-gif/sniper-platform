import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({ amount: z.number().int().positive() });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  if (parsed.data.amount > user.recruiterProfile.balance) {
    return NextResponse.json({ error: "Недостаточно средств на балансе" }, { status: 400 });
  }

  const [withdrawal] = await prisma.$transaction([
    prisma.withdrawal.create({
      data: { recruiterId: user.recruiterProfile.id, amount: parsed.data.amount },
    }),
    prisma.recruiterProfile.update({
      where: { id: user.recruiterProfile.id },
      data: { balance: { decrement: parsed.data.amount } },
    }),
  ]);

  return NextResponse.json(withdrawal, { status: 201 });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const withdrawals = await prisma.withdrawal.findMany({
    where: { recruiterId: user.recruiterProfile.id },
    orderBy: { requestedAt: "desc" },
  });
  return NextResponse.json(withdrawals);
}
