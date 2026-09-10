-- AlterTable: candidates — файл резюме (base64), необязательный
ALTER TABLE "candidates" ADD COLUMN "resumeFileName" TEXT;
ALTER TABLE "candidates" ADD COLUMN "resumeFileType" TEXT;
ALTER TABLE "candidates" ADD COLUMN "resumeFileData" TEXT;
