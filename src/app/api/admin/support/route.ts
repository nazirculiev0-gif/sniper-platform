import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// GET /api/admin/support — список всех тредов поддержки, свежие сверху
export async function GET() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const threads = await prisma.supportThread.findMany({
    include: {
      user: { include: { company: true, recruiterProfile: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { messages: { where: { fromAdmin: false, readByAdmin: false } } } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(threads);
}
