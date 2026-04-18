-- Reportes de venta del cliente aliado (sell-out).
-- El cliente registra sus ventas desde el portal web.
-- Two Six revisa y aprueba antes de procesar. 100% aditivo.

CREATE TYPE "SellReportStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "consignment_sell_report" (
  "id" SERIAL NOT NULL,
  "id_warehouse" INTEGER NOT NULL,
  "id_customer" INTEGER NOT NULL,
  "status" "SellReportStatus" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "rejected_reason" TEXT,
  "approved_at" TIMESTAMP(3),
  "approved_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),

  CONSTRAINT "consignment_sell_report_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consignment_sell_report_item" (
  "id" SERIAL NOT NULL,
  "id_sell_report" INTEGER NOT NULL,
  "id_clothing_size" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "consignment_sell_report_item_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "consignment_sell_report" ADD CONSTRAINT "consignment_sell_report_id_warehouse_fkey" FOREIGN KEY ("id_warehouse") REFERENCES "consignment_warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consignment_sell_report" ADD CONSTRAINT "consignment_sell_report_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consignment_sell_report_item" ADD CONSTRAINT "consignment_sell_report_item_id_sell_report_fkey" FOREIGN KEY ("id_sell_report") REFERENCES "consignment_sell_report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "consignment_sell_report_item" ADD CONSTRAINT "consignment_sell_report_item_id_clothing_size_fkey" FOREIGN KEY ("id_clothing_size") REFERENCES "clothing_size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
