-- Consignment Module Phase 2: F03 (dispatches with QR validation)
-- 100% additive: no DROP, no DELETE, no data loss.

-- CreateEnum
CREATE TYPE "ConsignmentDispatchStatus" AS ENUM ('PENDIENTE', 'EN_TRANSITO', 'RECIBIDO', 'CANCELADO');

-- CreateTable: consignment_dispatch
CREATE TABLE "consignment_dispatch" (
    "id" SERIAL NOT NULL,
    "id_warehouse" INTEGER NOT NULL,
    "dispatch_number" TEXT NOT NULL,
    "status" "ConsignmentDispatchStatus" NOT NULL DEFAULT 'PENDIENTE',
    "qr_token" TEXT NOT NULL,
    "notes" TEXT,
    "sent_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "received_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "consignment_dispatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable: consignment_dispatch_item
CREATE TABLE "consignment_dispatch_item" (
    "id" SERIAL NOT NULL,
    "id_dispatch" INTEGER NOT NULL,
    "id_clothing_size" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consignment_dispatch_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consignment_dispatch_dispatch_number_key" ON "consignment_dispatch"("dispatch_number");
CREATE UNIQUE INDEX "consignment_dispatch_qr_token_key" ON "consignment_dispatch"("qr_token");

-- AddForeignKey
ALTER TABLE "consignment_dispatch" ADD CONSTRAINT "consignment_dispatch_id_warehouse_fkey" FOREIGN KEY ("id_warehouse") REFERENCES "consignment_warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consignment_dispatch_item" ADD CONSTRAINT "consignment_dispatch_item_id_dispatch_fkey" FOREIGN KEY ("id_dispatch") REFERENCES "consignment_dispatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consignment_dispatch_item" ADD CONSTRAINT "consignment_dispatch_item_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
