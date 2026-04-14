-- Tabla de novedades de nómina por empleado/período (horas extra, comisiones,
-- bonificaciones, ausentismos, incapacidades, vacaciones, etc.)
-- 100% aditiva: tabla nueva, no modifica nada existente.

CREATE TYPE "PayrollNovedadType" AS ENUM (
  'HORAS_EXTRA_DIURNAS',
  'HORAS_EXTRA_NOCTURNAS',
  'HORAS_EXTRA_DOMINICALES',
  'COMISION',
  'BONIFICACION',
  'INCAPACIDAD_COMUN',
  'INCAPACIDAD_LABORAL',
  'LICENCIA_REMUNERADA',
  'LICENCIA_NO_REMUNERADA',
  'VACACIONES',
  'AUSENTISMO',
  'OTRO_DEVENGADO',
  'OTRO_DEDUCIBLE'
);

CREATE TABLE "payroll_novedad" (
  "id" SERIAL NOT NULL,
  "id_employee" INTEGER NOT NULL,
  "id_payroll_period" INTEGER NOT NULL,
  "type" "PayrollNovedadType" NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3),

  CONSTRAINT "payroll_novedad_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payroll_novedad_period_employee_idx" ON "payroll_novedad" ("id_payroll_period", "id_employee");

ALTER TABLE "payroll_novedad" ADD CONSTRAINT "payroll_novedad_id_employee_fkey" FOREIGN KEY ("id_employee") REFERENCES "employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "payroll_novedad" ADD CONSTRAINT "payroll_novedad_id_payroll_period_fkey" FOREIGN KEY ("id_payroll_period") REFERENCES "payroll_period"("id") ON DELETE CASCADE ON UPDATE CASCADE;
