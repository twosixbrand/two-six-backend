-- Consignment Module Phase 4: F04 (returns + warranties), F05 (credit notes link)
-- 100% additive: no DROP, no DELETE, no data loss.

-- CreateEnum
CREATE TYPE "ConsignmentReturnType" AS ENUM ('PORTFOLIO', 'WARRANTY', 'POST_SALE');
CREATE TYPE "ConsignmentReturnStatus" AS ENUM ('DRAFT', 'PROCESSED', 'CANCELLED');

-- CreateTable: consignment_return
CREATE TABLE "consignment_return" (
    "id" SERIAL NOT NULL,
    "id_warehouse" INTEGER NOT NULL,
    "return_type" "ConsignmentReturnType" NOT NULL,
    "status" "ConsignmentReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "id_order" INTEGER,
    "notes" TEXT,
    "processed_at" TIMESTAMP(3),
    "credit_note_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "consignment_return_pkey" PRIMARY KEY ("id")
);

-- CreateTable: consignment_return_item
CREATE TABLE "consignment_return_item" (
    "id" SERIAL NOT NULL,
    "id_return" INTEGER NOT NULL,
    "id_clothing_size" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consignment_return_item_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "consignment_return" ADD CONSTRAINT "consignment_return_id_warehouse_fkey" FOREIGN KEY ("id_warehouse") REFERENCES "consignment_warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consignment_return" ADD CONSTRAINT "consignment_return_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "consignment_return_item" ADD CONSTRAINT "consignment_return_item_id_return_fkey" FOREIGN KEY ("id_return") REFERENCES "consignment_return"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consignment_return_item" ADD CONSTRAINT "consignment_return_item_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
