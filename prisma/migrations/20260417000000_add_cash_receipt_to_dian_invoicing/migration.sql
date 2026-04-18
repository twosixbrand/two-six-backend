-- Agrega trazabilidad del cruce de anticipo en facturación manual DIAN.
-- 100% aditivo: columna nullable + FK opcional. No afecta datos existentes.

ALTER TABLE "dian_e_invoicing" ADD COLUMN "cash_receipt_journal_id" INTEGER;

ALTER TABLE "dian_e_invoicing"
  ADD CONSTRAINT "dian_e_invoicing_cash_receipt_journal_id_fkey"
  FOREIGN KEY ("cash_receipt_journal_id") REFERENCES "journal_entry"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
