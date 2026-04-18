-- Snapshot JSON de datos de factura manual (cliente, ítems, totales) para que
-- el PDF representativo pueda renderizar la información cuando no existe una
-- Order asociada. 100% aditivo, nullable.

ALTER TABLE "dian_e_invoicing" ADD COLUMN "manual_invoice_snapshot" TEXT;
