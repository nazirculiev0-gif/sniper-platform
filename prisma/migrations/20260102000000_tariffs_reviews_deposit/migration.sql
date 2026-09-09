-- CreateEnum
CREATE TYPE "TariffCategory" AS ENUM ('JUNIOR', 'MIDDLE', 'SENIOR', 'LEAD', 'TOP_MANAGEMENT');

-- AlterTable: recruiter_profiles — публичный профиль
ALTER TABLE "recruiter_profiles" ADD COLUMN "bio" TEXT;
ALTER TABLE "recruiter_profiles" ADD COLUMN "specializations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "recruiter_profiles" ADD COLUMN "regions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "recruiter_profiles" ADD COLUMN "yearsExperience" INTEGER;

-- AlterTable: vacancy_requests — тариф, депозит, дедлайн закрепления, буст
ALTER TABLE "vacancy_requests" ADD COLUMN "tariffCategory" "TariffCategory" NOT NULL DEFAULT 'MIDDLE';
ALTER TABLE "vacancy_requests" ADD COLUMN "depositAmount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vacancy_requests" ADD COLUMN "depositPaid" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "vacancy_requests" ADD COLUMN "depositRefundedAt" TIMESTAMP(3);
ALTER TABLE "vacancy_requests" ADD COLUMN "claimDeadline" TIMESTAMP(3);
ALTER TABLE "vacancy_requests" ADD COLUMN "autoReleasedCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "vacancy_requests" ADD COLUMN "boostedUntil" TIMESTAMP(3);

-- AlterTable: messages — статус прочтения
ALTER TABLE "messages" ADD COLUMN "readAt" TIMESTAMP(3);

-- CreateTable: reviews
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "text" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestId" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "reviews_requestId_key" ON "reviews"("requestId");

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "vacancy_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "recruiter_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
