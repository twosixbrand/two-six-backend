/*
  Warnings:

  - You are about to alter the column `quantity` on the `design` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "design" ALTER COLUMN "quantity" SET DATA TYPE INTEGER;
