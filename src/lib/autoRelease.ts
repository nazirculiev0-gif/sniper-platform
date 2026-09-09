import { prisma } from "@/lib/prisma";

// Возвращает на биржу заявки, у которых истёк 14-дневный дедлайн закрепления
// и при этом рекрутер не добавил ни одного кандидата.
// В проде это должно быть cron-задачей (BullMQ/Vercel Cron); здесь — ленивая
// проверка при каждом обращении к бирже, что для MVP даёт тот же результат
// без необходимости в отдельном воркере.
export async function releaseExpiredClaims() {
  const now = new Date();

  const expired = await prisma.vacancyRequest.findMany({
    where: {
      status: "IN_PROGRESS",
      claimDeadline: { lt: now },
    },
    include: { candidates: true, participants: true },
  });

  for (const r of expired) {
    if (r.candidates.length > 0) continue; // есть активность — не трогаем

    await prisma.$transaction([
      prisma.requestParticipant.deleteMany({ where: { requestId: r.id } }),
      prisma.vacancyRequest.update({
        where: { id: r.id },
        data: {
          status: "OPEN",
          claimedAt: null,
          claimDeadline: null,
          autoReleasedCount: { increment: 1 },
        },
      }),
    ]);
  }

  return expired.length;
}
