-- AlterEnum: уведомление о сообщении поддержки
ALTER TYPE "NotificationType" ADD VALUE 'SUPPORT_MESSAGE';

-- CreateEnum
CREATE TYPE "SupportThreadStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable: support_threads — один тред поддержки на пользователя
CREATE TABLE "support_threads" (
    "id" TEXT NOT NULL,
    "status" "SupportThreadStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "support_threads_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "support_threads_userId_key" ON "support_threads"("userId");

ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: support_messages
CREATE TABLE "support_messages" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "fromAdmin" BOOLEAN NOT NULL DEFAULT false,
    "readByUser" BOOLEAN NOT NULL DEFAULT false,
    "readByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "threadId" TEXT NOT NULL,

    CONSTRAINT "support_messages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_threadId_fkey"
  FOREIGN KEY ("threadId") REFERENCES "support_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
