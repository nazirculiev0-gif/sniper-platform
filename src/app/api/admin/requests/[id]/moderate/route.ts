import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]) });

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.vacancyRequest.update({
    where: { id: params.id },
    data: {
      moderation: parsed.data.decision,
      status: parsed.data.decision === "APPROVED" ? "OPEN" : "CLOSED",
    },
  });

  return NextResponse.json(updated);
}
