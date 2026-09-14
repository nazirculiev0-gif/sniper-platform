import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

function digitsOnly(s: string) {
  return s.replace(/\D/g, "");
}

// GET /api/candidates/check-duplicate?phone=...&name=...
// Ищет в личной базе рекрутера кандидатов с тем же телефоном (по цифрам,
// последние 9 — на случай разного написания +998) или точным совпадением ФИО.
// Ничего не блокирует — просто подсказка для UI перед созданием карточки.
export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const phone = url.searchParams.get("phone")?.trim() || "";
  const name = url.searchParams.get("name")?.trim() || "";
  if (!phone && !name) return NextResponse.json([]);

  const phoneDigits = digitsOnly(phone);
  const phoneTail = phoneDigits.slice(-9); // локальный номер без кода страны
  const nameLower = name.toLowerCase();

  const candidates = await prisma.candidate.findMany({
    where: { recruiterId: user.recruiterProfile.id },
    select: { id: true, name: true, phone: true, profession: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const matches = candidates.filter((c) => {
    const phoneMatch = phoneTail.length >= 7 && c.phone && digitsOnly(c.phone).slice(-9) === phoneTail;
    const nameMatch = nameLower.length > 1 && c.name.trim().toLowerCase() === nameLower;
    return phoneMatch || nameMatch;
  });

  return NextResponse.json(matches.slice(0, 3));
}
