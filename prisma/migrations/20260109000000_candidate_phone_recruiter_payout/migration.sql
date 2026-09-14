-- AlterTable: candidates — телефон
ALTER TABLE "candidates" ADD COLUMN "phone" TEXT;

-- AlterTable: recruiter_profiles — карта для выплат и статус самозанятости
ALTER TABLE "recruiter_profiles" ADD COLUMN "cardLast4" TEXT;
ALTER TABLE "recruiter_profiles" ADD COLUMN "cardBrand" TEXT;
ALTER TABLE "recruiter_profiles" ADD COLUMN "cardHolder" TEXT;
ALTER TABLE "recruiter_profiles" ADD COLUMN "isSelfEmployed" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "recruiter_profiles" ADD COLUMN "taxId" TEXT;
