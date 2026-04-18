-- Campo JSON opcional para guardar metadata estructurada de un asiento.
-- Uso inicial: recibos de caja (CASH_RECEIPT) guardan datos del cliente
-- (NIT, nombre, notas) que se necesitan al reanudar desde el wizard.

ALTER TABLE "journal_entry" ADD COLUMN "metadata" TEXT;
