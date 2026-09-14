-- AlterTable: candidates — город, языки, теги, готовность к релокации
ALTER TABLE "candidates" ADD COLUMN "city" TEXT;
ALTER TABLE "candidates" ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "candidates" ADD COLUMN "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "candidates" ADD COLUMN "willingToRelocate" BOOLEAN NOT NULL DEFAULT false;
