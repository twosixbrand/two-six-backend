/*
  Warnings:

  - You are about to drop the `proveedor` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."proveedor";

-- CreateTable
CREATE TABLE "provider" (
    "nit" TEXT NOT NULL,
    "razon_social" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cuenta_bancaria" TEXT NOT NULL,
    "tipo_cuenta" TEXT NOT NULL,
    "banco" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provider_pkey" PRIMARY KEY ("nit")
);

-- CreateIndex
CREATE UNIQUE INDEX "provider_email_key" ON "provider"("email");
