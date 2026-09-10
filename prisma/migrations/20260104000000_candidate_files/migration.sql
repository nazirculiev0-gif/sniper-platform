-- CreateEnum
CREATE TYPE "CandidateFileCategory" AS ENUM ('RESUME', 'OTHER');

-- CreateTable: candidate_files — файлы, дозагруженные после создания карточки кандидата
CREATE TABLE "candidate_files" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT,
    "fileData" TEXT NOT NULL,
    "category" "CandidateFileCategory" NOT NULL DEFAULT 'OTHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "candidateId" TEXT NOT NULL,

    CONSTRAINT "candidate_files_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "candidate_files" ADD CONSTRAINT "candidate_files_candidateId_fkey"
  FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
