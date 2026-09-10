-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM (
  'MESSAGE',
  'CANDIDATE_ADDED',
  'INTERVIEW_SCHEDULED',
  'RECRUITER_JOINED',
  'HIRE_CONFIRMED',
  'REQUEST_MODERATED',
  'RECRUITER_VERIFIED',
  'PAYOUT_RELEASED',
  'WITHDRAWAL_REQUESTED',
  'REVIEW_RECEIVED',
  'REQUEST_AUTO_RELEASED',
  'NEW_REQUEST_PENDING',
  'RECRUITER_REGISTERED'
);

-- CreateTable: notifications
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
