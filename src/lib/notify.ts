import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

// Создаёт уведомление для конкретного пользователя (по User.id).
export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string
) {
  await prisma.notification.create({ data: { userId, type, title, body, link } });
}

// Создаёт уведомление для владельца компании (по Company.id).
export async function notifyCompany(
  companyId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string
) {
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { userId: true } });
  if (company) await notifyUser(company.userId, type, title, body, link);
}

// Создаёт уведомление для рекрутера (по RecruiterProfile.id).
export async function notifyRecruiter(
  recruiterProfileId: string,
  type: NotificationType,
  title: string,
  body?: string,
  link?: string
) {
  const recruiter = await prisma.recruiterProfile.findUnique({
    where: { id: recruiterProfileId },
    select: { userId: true },
  });
  if (recruiter) await notifyUser(recruiter.userId, type, title, body, link);
}

// Создаёт уведомление всем администраторам платформы.
export async function notifyAdmins(type: NotificationType, title: string, body?: string, link?: string) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  if (admins.length === 0) return;
  await prisma.notification.createMany({
    data: admins.map((a) => ({ userId: a.id, type, title, body, link })),
  });
}
