/*
  Warnings:

  - You are about to drop the column `id_size` on the `clothing_color` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_available` on the `clothing_color` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_on_consignment` on the `clothing_color` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_produced` on the `clothing_color` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_sold` on the `clothing_color` table. All the data in the column will be lost.
  - You are about to drop the column `quantity_under_warranty` on the `clothing_color` table. All the data in the column will be lost.
  - You are about to drop the column `id_clothing_color` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `id_clothing_color` on the `stock` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[id_clothing_size]` on the table `product` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_clothing_size]` on the table `stock` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_clothing_size` to the `product` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_clothing_size` to the `stock` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "clothing_color" DROP CONSTRAINT "clothing_color_id_size_fkey";

-- DropForeignKey
ALTER TABLE "product" DROP CONSTRAINT "product_id_clothing_color_fkey";

-- DropForeignKey
ALTER TABLE "stock" DROP CONSTRAINT "stock_id_clothing_color_fkey";

-- DropIndex
DROP INDEX "product_id_clothing_color_key";

-- DropIndex
DROP INDEX "stock_id_clothing_color_key";

-- AlterTable
ALTER TABLE "clothing_color" DROP COLUMN "id_size",
DROP COLUMN "quantity_available",
DROP COLUMN "quantity_on_consignment",
DROP COLUMN "quantity_produced",
DROP COLUMN "quantity_sold",
DROP COLUMN "quantity_under_warranty";

-- AlterTable
ALTER TABLE "product" DROP COLUMN "id_clothing_color",
ADD COLUMN     "id_clothing_size" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "stock" DROP COLUMN "id_clothing_color",
ADD COLUMN     "id_clothing_size" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "clothing_size" (
    "id" SERIAL NOT NULL,
    "id_size" INTEGER NOT NULL,
    "id_clothing_color" INTEGER NOT NULL,
    "quantity_produced" INTEGER NOT NULL,
    "quantity_available" INTEGER NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "quantity_on_consignment" INTEGER NOT NULL,
    "quantity_under_warranty" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "clothing_size_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "product_id_clothing_size_key" ON "product"("id_clothing_size");

-- CreateIndex
CREATE UNIQUE INDEX "stock_id_clothing_size_key" ON "stock"("id_clothing_size");

-- AddForeignKey
ALTER TABLE "clothing_size" ADD CONSTRAINT "clothing_size_id_size_fkey" FOREIGN KEY ("id_size") REFERENCES "size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothing_size" ADD CONSTRAINT "clothing_size_id_clothing_color_fkey" FOREIGN KEY ("id_clothing_color") REFERENCES "clothing_color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
