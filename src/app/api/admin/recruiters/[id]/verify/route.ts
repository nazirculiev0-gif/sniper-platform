import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyRecruiter } from "@/lib/notify";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const updated = await prisma.recruiterProfile.update({
    where: { id: params.id },
    data: { verified: true },
  });

  await notifyRecruiter(
    updated.id,
    "RECRUITER_VERIFIED",
    "Аккаунт верифицирован",
    "Теперь вы можете брать заявки на бирже",
    "/dashboard"
  );

  return NextResponse.json(updated);
}
