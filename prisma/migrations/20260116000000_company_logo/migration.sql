-- AlterTable: companies — логотип (base64)
ALTER TABLE "companies" ADD COLUMN "logoData" TEXT;
ALTER TABLE "companies" ADD COLUMN "logoType" TEXT;
