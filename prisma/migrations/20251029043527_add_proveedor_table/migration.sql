/*
  Warnings:

  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Type_Clothing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `clothing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consecutive_category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consecutive_reference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `error_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_app` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `year_production` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_role" DROP CONSTRAINT "user_role_code_user_fkey";

-- DropTable
DROP TABLE "public"."Product";

-- DropTable
DROP TABLE "public"."Type_Clothing";

-- DropTable
DROP TABLE "public"."category";

-- DropTable
DROP TABLE "public"."clothing";

-- DropTable
DROP TABLE "public"."collection";

-- DropTable
DROP TABLE "public"."consecutive_category";

-- DropTable
DROP TABLE "public"."consecutive_reference";

-- DropTable
DROP TABLE "public"."error_log";

-- DropTable
DROP TABLE "public"."reference";

-- DropTable
DROP TABLE "public"."user_app";

-- DropTable
DROP TABLE "public"."year_production";

-- DropEnum
DROP TYPE "public"."Gender";

-- CreateTable
CREATE TABLE "usuario" (
    "code_user" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("code_user")
);

-- CreateTable
CREATE TABLE "proveedor" (
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

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("nit")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "proveedor_email_key" ON "proveedor"("email");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_code_user_fkey" FOREIGN KEY ("code_user") REFERENCES "usuario"("code_user") ON DELETE RESTRICT ON UPDATE CASCADE;
