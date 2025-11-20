-- AlterTable
ALTER TABLE "user_app" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expires_at" TIMESTAMP(3);
