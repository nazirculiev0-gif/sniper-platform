import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";

// Определяем платёжную систему по первым цифрам номера карты.
// Полный номер карты нигде не сохраняется — только последние 4 цифры и бренд.
function detectBrand(fullNumber: string): string {
  const n = fullNumber.replace(/\D/g, "");
  if (n.startsWith("9860")) return "Humo";
  if (n.startsWith("8600")) return "Uzcard";
  if (n.startsWith("4")) return "Visa";
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01])/.test(n)) return "Mastercard";
  return "Карта";
}

const schema = z.object({
  cardNumber: z.string().min(12).max(23), // приходит с пробелами, только для определения last4/бренда
  cardHolder: z.string().min(2).max(80),
});

// POST /api/recruiter-profile/card — привязать/заменить карту для вывода средств.
// Полный номер карты не сохраняется на сервере — только последние 4 цифры и платёжная система.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const digits = parsed.data.cardNumber.replace(/\D/g, "");
  if (digits.length < 12) {
    return NextResponse.json({ error: "Номер карты указан некорректно" }, { status: 400 });
  }

  const updated = await prisma.recruiterProfile.update({
    where: { id: user.recruiterProfile.id },
    data: {
      cardLast4: digits.slice(-4),
      cardBrand: detectBrand(digits),
      cardHolder: parsed.data.cardHolder,
    },
    select: { cardLast4: true, cardBrand: true, cardHolder: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/recruiter-profile/card — открепить карту
export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role !== "RECRUITER" || !user.recruiterProfile) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.recruiterProfile.update({
    where: { id: user.recruiterProfile.id },
    data: { cardLast4: null, cardBrand: null, cardHolder: null },
  });

  return NextResponse.json({ ok: true });
}
