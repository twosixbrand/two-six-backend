-- Tabla de configuración clave-valor para parámetros contables globales
-- (régimen tributario, responsabilidades DIAN, etc). 100% aditiva.

CREATE TABLE "accounting_setting" (
  "id" SERIAL NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "description" TEXT,
  "updated_by" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),

  CONSTRAINT "accounting_setting_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accounting_setting_key_key" ON "accounting_setting" ("key");

-- Insert defaults (sin bloquear si ya existen — en fresh no hay)
INSERT INTO "accounting_setting" ("key", "value", "description") VALUES
  ('TAX_REGIME', 'COMUN', 'Régimen tributario: COMUN o SIMPLE'),
  ('IVA_RATE', '0.19', 'Tasa de IVA aplicable (decimal)'),
  ('ACCOUNTING_AUTOCRON_ENABLED', 'true', 'Habilita schedulers de depreciación y cierre'),
  ('COMPANY_NIT', '', 'NIT del empleador para PILA y DIAN (fallback a env)'),
  ('COMPANY_NAME', 'TWO SIX', 'Razón social');
