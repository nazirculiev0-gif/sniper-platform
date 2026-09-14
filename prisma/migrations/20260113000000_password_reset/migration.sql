-- AlterTable: users — восстановление пароля по токену из письма
ALTER TABLE "users" ADD COLUMN "resetToken" TEXT;
ALTER TABLE "users" ADD COLUMN "resetTokenExpires" TIMESTAMP(3);
