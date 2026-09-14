-- AlterTable: users — подтверждение email кодом
ALTER TABLE "users" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "verificationCode" TEXT;
ALTER TABLE "users" ADD COLUMN "verificationExpires" TIMESTAMP(3);
