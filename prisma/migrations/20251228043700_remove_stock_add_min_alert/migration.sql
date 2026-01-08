/*
  Warnings:

  - You are about to drop the `stock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_id_clothing_size_fkey";

-- AlterTable
ALTER TABLE "clothing_size" ADD COLUMN     "quantity_minimum_alert" INTEGER;

-- DropTable
DROP TABLE "stock";
