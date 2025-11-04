/*
  Warnings:

  - You are about to drop the column `model_number` on the `user_app` table. All the data in the column will be lost.
  - Added the required column `phone` to the `user_app` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "user_app" DROP COLUMN "model_number",
ADD COLUMN     "phone" TEXT NOT NULL;
