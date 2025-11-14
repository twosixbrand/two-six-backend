/*
  Warnings:

  - You are about to drop the `return_items` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "return_items" DROP CONSTRAINT "return_items_id_order_item_fkey";

-- DropForeignKey
ALTER TABLE "return_items" DROP CONSTRAINT "return_items_id_product_fkey";

-- DropForeignKey
ALTER TABLE "return_items" DROP CONSTRAINT "return_items_id_return_fkey";

-- DropTable
DROP TABLE "return_items";

-- CreateTable
CREATE TABLE "return_item" (
    "id" SERIAL NOT NULL,
    "id_return" INTEGER NOT NULL,
    "id_order_item" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason_return" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "return_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_id_return_fkey" FOREIGN KEY ("id_return") REFERENCES "returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_id_order_item_fkey" FOREIGN KEY ("id_order_item") REFERENCES "order_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_item" ADD CONSTRAINT "return_item_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
