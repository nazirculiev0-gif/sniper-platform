import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

const schema = z.object({
  bio: z.string().max(1000).optional(),
  specializations: z.array(z.string()).default([]),
  regions: z.array(z.string()).default([]),
  yearsExperience: z.number().int().min(0).max(60).optional(),
});

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await prisma.recruiterProfile.update({
    where: { id: user.recruiterProfile.id },
    data: parsed.data,
  });

  return NextResponse.json(updated);
}
