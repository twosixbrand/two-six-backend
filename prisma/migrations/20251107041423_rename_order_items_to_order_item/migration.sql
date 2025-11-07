/*
  Warnings:

  - The primary key for the `customer` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id_customer` on the `customer` table. All the data in the column will be lost.
  - You are about to drop the `order_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."order" DROP CONSTRAINT "order_id_customer_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_id_order_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_id_product_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_id_customer_fkey";

-- DropForeignKey
ALTER TABLE "public"."return_items" DROP CONSTRAINT "return_items_id_order_item_fkey";

-- DropForeignKey
ALTER TABLE "public"."returns" DROP CONSTRAINT "returns_id_customer_fkey";

-- AlterTable
ALTER TABLE "customer" DROP CONSTRAINT "customer_pkey",
DROP COLUMN "id_customer",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "customer_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."order_items";

-- CreateTable
CREATE TABLE "order_item" (
    "id" SERIAL NOT NULL,
    "id_order" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "order_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item" ADD CONSTRAINT "order_item_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_id_order_item_fkey" FOREIGN KEY ("id_order_item") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
