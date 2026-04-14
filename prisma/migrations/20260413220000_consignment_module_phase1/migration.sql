-- Consignment Module Phase 1: F01 (warehouses), F02 (customer prices)
-- 100% additive: no DROP, no DELETE, no data loss.

-- CreateEnum
CREATE TYPE "ConsignmentStockStatus" AS ENUM ('PENDIENTE_RECEPCION', 'EN_CONSIGNACION', 'DEVUELTO', 'MERMADO');

-- AlterTable: add consignment ally flag (default false preserves existing rows)
ALTER TABLE "customer" ADD COLUMN "is_consignment_ally" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable: consignment_warehouse
CREATE TABLE "consignment_warehouse" (
    "id" SERIAL NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "consignment_warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable: consignment_stock
CREATE TABLE "consignment_stock" (
    "id" SERIAL NOT NULL,
    "id_warehouse" INTEGER NOT NULL,
    "id_clothing_size" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "status" "ConsignmentStockStatus" NOT NULL DEFAULT 'PENDIENTE_RECEPCION',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "consignment_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable: customer_consignment_price
CREATE TABLE "customer_consignment_price" (
    "id" SERIAL NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "valid_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valid_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "customer_consignment_price_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consignment_stock_id_warehouse_id_clothing_size_status_key" ON "consignment_stock"("id_warehouse", "id_clothing_size", "status");
CREATE UNIQUE INDEX "customer_consignment_price_id_customer_id_product_valid_from_key" ON "customer_consignment_price"("id_customer", "id_product", "valid_from");

-- AddForeignKey
ALTER TABLE "consignment_warehouse" ADD CONSTRAINT "consignment_warehouse_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consignment_stock" ADD CONSTRAINT "consignment_stock_id_warehouse_fkey" FOREIGN KEY ("id_warehouse") REFERENCES "consignment_warehouse"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consignment_stock" ADD CONSTRAINT "consignment_stock_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_consignment_price" ADD CONSTRAINT "customer_consignment_price_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "customer_consignment_price" ADD CONSTRAINT "customer_consignment_price_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
