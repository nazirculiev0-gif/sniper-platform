import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/currentUser";
import { notifyRecruiter } from "@/lib/notify";

const schema = z.object({ status: z.enum(["PAID", "REJECTED"]) });

// PATCH /api/withdrawals/:id — только ADMIN.
// PAID — деньги фактически переведены на карту рекрутера (вручную, вне платформы),
// баланс уже был списан при создании заявки на вывод.
// REJECTED — возвращаем сумму обратно на баланс рекрутера.
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: params.id } });
  if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (withdrawal.status !== "PENDING") {
    return NextResponse.json({ error: "Запрос уже обработан" }, { status: 400 });
  }

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await prisma.$transaction([
    prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: parsed.data.status,
        paidAt: parsed.data.status === "PAID" ? new Date() : undefined,
      },
    }),
    ...(parsed.data.status === "REJECTED"
      ? [
          prisma.recruiterProfile.update({
            where: { id: withdrawal.recruiterId },
            data: { balance: { increment: withdrawal.amount } },
          }),
        ]
      : []),
  ]);

  await notifyRecruiter(
    withdrawal.recruiterId,
    parsed.data.status === "PAID" ? "WITHDRAWAL_PAID" : "WITHDRAWAL_REJECTED",
    parsed.data.status === "PAID" ? "Выплата выполнена" : "Запрос на вывод отклонён",
    parsed.data.status === "PAID"
      ? `${withdrawal.amount.toLocaleString("ru-RU")} сум переведены на вашу карту`
      : `Запрос на вывод ${withdrawal.amount.toLocaleString("ru-RU")} сум отклонён, сумма возвращена на баланс`,
    "/dashboard/payments"
  );

  return NextResponse.json(updated);
}
