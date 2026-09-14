-- AlterEnum: уведомления об исходе запроса на вывод средств
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_PAID';
ALTER TYPE "NotificationType" ADD VALUE 'WITHDRAWAL_REJECTED';
