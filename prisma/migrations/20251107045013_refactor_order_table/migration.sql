/*
  Warnings:

  - You are about to drop the column `payment_method` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `sub_total` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `total` on the `order` table. All the data in the column will be lost.
  - Added the required column `iva` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchase_date` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipping_cost` to the `order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total_payment` to the `order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "order" DROP COLUMN "payment_method",
DROP COLUMN "sub_total",
DROP COLUMN "tax",
DROP COLUMN "total",
ADD COLUMN     "iva" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "purchase_date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "shipping_cost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "total_payment" DOUBLE PRECISION NOT NULL;
