import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const TARIFFS: Record<string, number> = {
  JUNIOR: 3_000_000,
  MIDDLE: 6_000_000,
  SENIOR: 10_000_000,
  LEAD: 16_000_000,
  TOP_MANAGEMENT: 25_000_000,
};

async function main() {
  const pass = await bcrypt.hash("password123", 10);

  const employer = await prisma.user.upsert({
    where: { email: "employer@demo.uz" },
    update: {},
    create: {
      email: "employer@demo.uz",
      passwordHash: pass,
      role: "EMPLOYER",
      company: { create: { name: "TechCorp LLC", industry: "IT" } },
    },
    include: { company: true },
  });

  const recruiter = await prisma.user.upsert({
    where: { email: "recruiter@demo.uz" },
    update: {},
    create: {
      email: "recruiter@demo.uz",
      passwordHash: pass,
      role: "RECRUITER",
      recruiterProfile: {
        create: {
          name: "Алия Каримова",
          type: "SOLO",
          verified: true,
          bio: "8 лет в IT-рекрутинге. Специализируюсь на backend и data-инженерах для fintech и e-commerce.",
          specializations: ["IT", "Backend", "Data"],
          regions: ["Ташкент"],
          yearsExperience: 8,
          rating: 4.7,
        },
      },
    },
    include: { recruiterProfile: true },
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.uz" },
    update: {},
    create: { email: "admin@demo.uz", passwordHash: pass, role: "ADMIN" },
  });

  const senior = TARIFFS.SENIOR;
  await prisma.vacancyRequest.create({
    data: {
      title: "Senior Backend Developer (Node.js)",
      description: "Ищем опытного backend-разработчика для fintech-продукта. Удалённо или гибрид, Ташкент.",
      skills: ["Node.js", "PostgreSQL", "TypeScript"],
      salaryFrom: 15000000,
      salaryTo: 25000000,
      mode: "OPEN",
      status: "OPEN",
      moderation: "APPROVED",
      tariffCategory: "SENIOR",
      rewardGross: senior,
      depositAmount: Math.round(senior * 0.15),
      depositPaid: true,
      companyId: employer.company!.id,
    },
  });

  if (recruiter.recruiterProfile) {
    await prisma.candidate.createMany({
      data: [
        {
          name: "Тимур Абдуллаев",
          profession: "Backend Developer",
          skills: ["Node.js", "PostgreSQL", "Docker"],
          expSalary: 18000000,
          searchStatus: "active",
          recruiterId: recruiter.recruiterProfile.id,
        },
        {
          name: "Жасур Норматов",
          profession: "Frontend Developer",
          skills: ["React", "TypeScript"],
          expSalary: 12000000,
          searchStatus: "passive",
          recruiterId: recruiter.recruiterProfile.id,
        },
      ],
    });
  }

  console.log("Seed done.");
  console.log("Логины (пароль у всех: password123):");
  console.log("  employer@demo.uz  — работодатель");
  console.log("  recruiter@demo.uz — рекрутер (заполненный публичный профиль)");
  console.log("  admin@demo.uz     — администратор");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
