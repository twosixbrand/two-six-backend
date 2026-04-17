-- Detalle de recepción por item de despacho: permite al cliente reportar
-- cantidades reales recibidas y observaciones por prenda. 100% aditivo.

ALTER TABLE "consignment_dispatch_item" ADD COLUMN "received_qty" INTEGER;
ALTER TABLE "consignment_dispatch_item" ADD COLUMN "received_ok" BOOLEAN DEFAULT false;
ALTER TABLE "consignment_dispatch_item" ADD COLUMN "observation" TEXT;
