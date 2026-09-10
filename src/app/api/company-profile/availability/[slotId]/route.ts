import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// DELETE /api/company-profile/availability/:slotId
export async function DELETE(_req: Request, { params }: { params: { slotId: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "EMPLOYER" || !user.company) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const slot = await prisma.availabilitySlot.findUnique({ where: { id: params.slotId } });
  if (!slot || slot.companyId !== user.company.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.availabilitySlot.delete({ where: { id: slot.id } });
  return NextResponse.json({ ok: true });
}
