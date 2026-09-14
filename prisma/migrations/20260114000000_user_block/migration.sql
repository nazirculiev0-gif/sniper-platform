-- AlterTable: users — блокировка аккаунта администратором
ALTER TABLE "users" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false;
