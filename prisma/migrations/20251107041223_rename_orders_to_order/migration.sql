/*
  Warnings:

  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."dian_e_invoicing" DROP CONSTRAINT "dian_e_invoicing_id_order_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_id_order_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_id_customer_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_id_order_fkey";

-- DropForeignKey
ALTER TABLE "public"."returns" DROP CONSTRAINT "returns_id_order_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipment" DROP CONSTRAINT "shipment_id_order_fkey";

-- DropTable
DROP TABLE "public"."orders";

-- CreateTable
CREATE TABLE "order" (
    "id_order" SERIAL NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "sub_total" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "is_paid" BOOLEAN NOT NULL,
    "payment_method" TEXT NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "order_pkey" PRIMARY KEY ("id_order")
);

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dian_e_invoicing" ADD CONSTRAINT "dian_e_invoicing_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;
