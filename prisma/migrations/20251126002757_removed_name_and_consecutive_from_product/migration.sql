/*
  Warnings:

  - You are about to drop the column `consecutive_number` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "consecutive_number",
DROP COLUMN "name";
