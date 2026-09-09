import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  stage: z.enum([
    "NEW",
    "SCREENING",
    "INTERVIEW",
    "OFFER",
    "OFFER_ACCEPTED",
    "HIRED",
    "REJECTED",
  ]),
});

// PATCH /api/candidates/:id — сменить этап канбана
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const candidate = await prisma.candidate.findUnique({ where: { id: params.id } });
  if (!candidate || candidate.recruiterId !== user.recruiterProfile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.candidate.update({
    where: { id: params.id },
    data: { stage: parsed.data.stage },
  });

  return NextResponse.json(updated);
}
