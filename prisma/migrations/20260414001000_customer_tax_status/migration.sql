-- Agrega responsabilidad tributaria al Customer para auto-aplicar retenciones
-- (ReteIVA, ReteICA) en facturas de venta cuando el cliente es gran contribuyente
-- o autorretenedor. 100% aditivo: default 'NORMAL' preserva comportamiento previo.

CREATE TYPE "CustomerTaxStatus" AS ENUM ('NORMAL', 'GRAN_CONTRIBUYENTE', 'AUTORETENEDOR');

ALTER TABLE "customer" ADD COLUMN "tax_status" "CustomerTaxStatus" NOT NULL DEFAULT 'NORMAL';
