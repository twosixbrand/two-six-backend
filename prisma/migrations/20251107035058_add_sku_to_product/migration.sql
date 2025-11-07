/*
  Warnings:

  - You are about to drop the column `outlet` on the `product` table. All the data in the column will be lost.
  - Added the required column `is_outlet` to the `product` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "product" DROP COLUMN "outlet",
ADD COLUMN     "is_outlet" BOOLEAN NOT NULL,
ADD COLUMN     "sku" TEXT;
