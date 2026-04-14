-- Consignment Module Phase 5: F06 (cycle counts), F07 (merma invoicing)
-- 100% additive: no DROP, no DELETE, no data loss.

-- CreateEnum
CREATE TYPE "InventoryCycleCountStatus" AS ENUM ('DRAFT', 'APPROVED', 'CANCELLED');

-- CreateTable: inventory_cycle_count
CREATE TABLE "inventory_cycle_count" (
    "id" SERIAL NOT NULL,
    "id_warehouse" INTEGER NOT NULL,
    "status" "InventoryCycleCountStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "approved_at" TIMESTAMP(3),
    "merma_order_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "inventory_cycle_count_pkey" PRIMARY KEY ("id")
);

-- CreateTable: inventory_cycle_count_item
CREATE TABLE "inventory_cycle_count_item" (
    "id" SERIAL NOT NULL,
    "id_cycle_count" INTEGER NOT NULL,
    "id_clothing_size" INTEGER NOT NULL,
    "theoretical_qty" INTEGER NOT NULL,
    "real_qty" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "inventory_cycle_count_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inventory_cycle_count_item_id_cycle_count_id_clothing_size_key" ON "inventory_cycle_count_item"("id_cycle_count", "id_clothing_size");

-- AddForeignKey
ALTER TABLE "inventory_cycle_count" ADD CONSTRAINT "inventory_cycle_count_id_warehouse_fkey" FOREIGN KEY ("id_warehouse") REFERENCES "consignment_warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "inventory_cycle_count_item" ADD CONSTRAINT "inventory_cycle_count_item_id_cycle_count_fkey" FOREIGN KEY ("id_cycle_count") REFERENCES "inventory_cycle_count"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "inventory_cycle_count_item" ADD CONSTRAINT "inventory_cycle_count_item_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
