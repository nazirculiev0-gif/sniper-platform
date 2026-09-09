import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

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
      recruiterProfile: { create: { name: "Алия Каримова", type: "SOLO", verified: true } },
    },
    include: { recruiterProfile: true },
  });

  await prisma.user.upsert({
    where: { email: "admin@demo.uz" },
    update: {},
    create: { email: "admin@demo.uz", passwordHash: pass, role: "ADMIN" },
  });

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
      rewardGross: 8000000,
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
  console.log("  recruiter@demo.uz — рекрутер");
  console.log("  admin@demo.uz     — администратор (пока без отдельного UI, доступ через API)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
