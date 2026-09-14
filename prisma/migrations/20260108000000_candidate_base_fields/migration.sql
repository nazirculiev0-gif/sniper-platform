-- AlterTable: candidates — расширенный профиль для личной базы рекрутера
ALTER TABLE "candidates" ADD COLUMN "gender" TEXT;
ALTER TABLE "candidates" ADD COLUMN "age" INTEGER;
ALTER TABLE "candidates" ADD COLUMN "desiredPositions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "candidates" ADD COLUMN "industry" TEXT;
ALTER TABLE "candidates" ADD COLUMN "currentEmployer" TEXT;
