/*
  Warnings:

  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code_cat` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `category` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `category` table. All the data in the column will be lost.
  - The primary key for the `clothing` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `clothing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `collection` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code_col` on the `collection` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `collection` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `collection` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `collection` table. All the data in the column will be lost.
  - You are about to drop the column `banco` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `cuenta_bancaria` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `direccion` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `razon_social` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `telefono` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_cuenta` on the `provider` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `provider` table. All the data in the column will be lost.
  - The primary key for the `role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code_role` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `role` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `role` table. All the data in the column will be lost.
  - The primary key for the `user_app` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code_user` on the `user_app` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_app` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_app` table. All the data in the column will be lost.
  - The primary key for the `user_role` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code_role` on the `user_role` table. All the data in the column will be lost.
  - You are about to drop the column `code_user` on the `user_role` table. All the data in the column will be lost.
  - You are about to drop the column `code_user_role` on the `user_role` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `user_role` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `user_role` table. All the data in the column will be lost.
  - The primary key for the `year_production` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `code_year` on the `year_production` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `year_production` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `year_production` table. All the data in the column will be lost.
  - You are about to drop the column `year` on the `year_production` table. All the data in the column will be lost.
  - You are about to drop the `Product` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Type_Clothing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consecutive_category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `consecutive_reference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `error_log` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `reference` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[email]` on the table `user_app` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updated_at` to the `category` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_category` to the `clothing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_type_clothing` to the `clothing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `clothing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `season` to the `collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `collection` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_number` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `account_type` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bank_name` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `company_name` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `user_app` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_app` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_role` to the `user_role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_user_app` to the `user_role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_role` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `year_production` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `year_production` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."user_role" DROP CONSTRAINT "user_role_code_role_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_role" DROP CONSTRAINT "user_role_code_user_fkey";

-- AlterTable
ALTER TABLE "category" DROP CONSTRAINT "category_pkey",
DROP COLUMN "code_cat",
DROP COLUMN "createdAt",
DROP COLUMN "description",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "category_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "clothing" DROP CONSTRAINT "clothing_pkey",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_category" INTEGER NOT NULL,
ADD COLUMN     "id_type_clothing" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "name" SET DATA TYPE TEXT,
ADD CONSTRAINT "clothing_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "collection" DROP CONSTRAINT "collection_pkey",
DROP COLUMN "code_col",
DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "season" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "description" SET DATA TYPE TEXT,
ADD CONSTRAINT "collection_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "provider" DROP COLUMN "banco",
DROP COLUMN "createdAt",
DROP COLUMN "cuenta_bancaria",
DROP COLUMN "direccion",
DROP COLUMN "razon_social",
DROP COLUMN "telefono",
DROP COLUMN "tipo_cuenta",
DROP COLUMN "updatedAt",
ADD COLUMN     "account_number" TEXT NOT NULL,
ADD COLUMN     "account_type" TEXT NOT NULL,
ADD COLUMN     "bank_name" TEXT NOT NULL,
ADD COLUMN     "company_name" TEXT NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "phone" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "role" DROP CONSTRAINT "role_pkey",
DROP COLUMN "code_role",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id_role" SERIAL NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "role_pkey" PRIMARY KEY ("id_role");

-- AlterTable
ALTER TABLE "user_app" DROP CONSTRAINT "user_app_pkey",
DROP COLUMN "code_user",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "id_user_app" SERIAL NOT NULL,
ADD COLUMN     "model_number" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "user_app_pkey" PRIMARY KEY ("id_user_app");

-- AlterTable
ALTER TABLE "user_role" DROP CONSTRAINT "user_role_pkey",
DROP COLUMN "code_role",
DROP COLUMN "code_user",
DROP COLUMN "code_user_role",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "id_role" INTEGER NOT NULL,
ADD COLUMN     "id_user_app" INTEGER NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "user_role_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "year_production" DROP CONSTRAINT "year_production_pkey",
DROP COLUMN "code_year",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
DROP COLUMN "year",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "id" SERIAL NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
ADD CONSTRAINT "year_production_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "public"."Product";

-- DropTable
DROP TABLE "public"."Type_Clothing";

-- DropTable
DROP TABLE "public"."consecutive_category";

-- DropTable
DROP TABLE "public"."consecutive_reference";

-- DropTable
DROP TABLE "public"."error_log";

-- DropTable
DROP TABLE "public"."reference";

-- DropEnum
DROP TYPE "public"."Gender";

-- CreateTable
CREATE TABLE "log_error" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "component_stack" TEXT,
    "app" VARCHAR(4),
    "page" VARCHAR(20),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "log_error_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "type_clothing" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "type_clothing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "color" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "size" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "size_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design" (
    "id" SERIAL NOT NULL,
    "id_provider" TEXT NOT NULL,
    "id_clothing" INTEGER NOT NULL,
    "id_collection" INTEGER NOT NULL,
    "id_year_production" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "manufactured_cost" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_clothing" (
    "id" SERIAL NOT NULL,
    "id_color" INTEGER NOT NULL,
    "id_size" INTEGER NOT NULL,
    "id_design" INTEGER NOT NULL,
    "quantity_produced" INTEGER NOT NULL,
    "quantity_available" INTEGER NOT NULL,
    "quantity_sold" INTEGER NOT NULL,
    "quantity_on_consignment" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_clothing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" SERIAL NOT NULL,
    "id_design_clothing" INTEGER NOT NULL,
    "current_quantity" INTEGER NOT NULL,
    "available_quantity" INTEGER NOT NULL,
    "sold_quantity" INTEGER NOT NULL,
    "consignment_quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product" (
    "id" SERIAL NOT NULL,
    "id_design_clothing" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "contraindication_image_url" TEXT,
    "active" BOOLEAN NOT NULL,
    "outlet" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer" (
    "id_customer" SERIAL NOT NULL,
    "id_customer_type" INTEGER NOT NULL,
    "id_identification_type" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "current_phone_number" TEXT NOT NULL,
    "responsable_for_vat" BOOLEAN NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_pkey" PRIMARY KEY ("id_customer")
);

-- CreateTable
CREATE TABLE "customer_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "identification_type" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "identification_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id_order" SERIAL NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "order_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "sub_total" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "is_paid" BOOLEAN NOT NULL,
    "payment_method" TEXT NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id_order")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" SERIAL NOT NULL,
    "id_order" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "product_name" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" SERIAL NOT NULL,
    "id_order" INTEGER NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "request_date" TIMESTAMP(3) NOT NULL,
    "refund_amount" DOUBLE PRECISION NOT NULL,
    "shipping_method" TEXT NOT NULL,
    "tracking" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" SERIAL NOT NULL,
    "id_return" INTEGER NOT NULL,
    "id_order_item" INTEGER NOT NULL,
    "id_product" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason_return" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_method" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_method_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "id_order" INTEGER NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "id_payment_method" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "transaction_date" TIMESTAMP(3) NOT NULL,
    "transaction_reference" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dian_e_invoicing" (
    "id" SERIAL NOT NULL,
    "id_order" INTEGER NOT NULL,
    "cufe_code" TEXT NOT NULL,
    "qr_code" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "url_pdf" TEXT NOT NULL,
    "url_xml" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dian_e_invoicing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_provider" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "set_tracking_base" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_provider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_rate" (
    "id" SERIAL NOT NULL,
    "id_shipping_provider" INTEGER NOT NULL,
    "destination_zone" TEXT NOT NULL,
    "weight_unit" TEXT NOT NULL,
    "base_cost" DOUBLE PRECISION NOT NULL,
    "cost_per_additional_unit" DOUBLE PRECISION NOT NULL,
    "estimated_delivery_time" TEXT NOT NULL,
    "shipping_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment" (
    "id" SERIAL NOT NULL,
    "id_order" INTEGER NOT NULL,
    "id_shipping_provider" INTEGER NOT NULL,
    "guide_number" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "estimated_delivery_date" TIMESTAMP(3) NOT NULL,
    "delivery_date" TIMESTAMP(3),
    "id_tracking" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracking_history" (
    "id" SERIAL NOT NULL,
    "id_shipment" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "update_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracking_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stock_id_design_clothing_key" ON "stock"("id_design_clothing");

-- CreateIndex
CREATE UNIQUE INDEX "product_id_design_clothing_key" ON "product"("id_design_clothing");

-- CreateIndex
CREATE UNIQUE INDEX "customer_email_key" ON "customer"("email");

-- CreateIndex
CREATE UNIQUE INDEX "dian_e_invoicing_id_order_key" ON "dian_e_invoicing"("id_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_app_email_key" ON "user_app"("email");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_id_user_app_fkey" FOREIGN KEY ("id_user_app") REFERENCES "user_app"("id_user_app") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "role"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothing" ADD CONSTRAINT "clothing_id_type_clothing_fkey" FOREIGN KEY ("id_type_clothing") REFERENCES "type_clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clothing" ADD CONSTRAINT "clothing_id_category_fkey" FOREIGN KEY ("id_category") REFERENCES "category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design" ADD CONSTRAINT "design_id_provider_fkey" FOREIGN KEY ("id_provider") REFERENCES "provider"("nit") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design" ADD CONSTRAINT "design_id_clothing_fkey" FOREIGN KEY ("id_clothing") REFERENCES "clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design" ADD CONSTRAINT "design_id_collection_fkey" FOREIGN KEY ("id_collection") REFERENCES "collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design" ADD CONSTRAINT "design_id_year_production_fkey" FOREIGN KEY ("id_year_production") REFERENCES "year_production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_clothing" ADD CONSTRAINT "design_clothing_id_color_fkey" FOREIGN KEY ("id_color") REFERENCES "color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_clothing" ADD CONSTRAINT "design_clothing_id_size_fkey" FOREIGN KEY ("id_size") REFERENCES "size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_clothing" ADD CONSTRAINT "design_clothing_id_design_fkey" FOREIGN KEY ("id_design") REFERENCES "design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock" ADD CONSTRAINT "stock_id_design_clothing_fkey" FOREIGN KEY ("id_design_clothing") REFERENCES "design_clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product" ADD CONSTRAINT "product_id_design_clothing_fkey" FOREIGN KEY ("id_design_clothing") REFERENCES "design_clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_id_customer_type_fkey" FOREIGN KEY ("id_customer_type") REFERENCES "customer_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer" ADD CONSTRAINT "customer_id_identification_type_fkey" FOREIGN KEY ("id_identification_type") REFERENCES "identification_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "orders"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "orders"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_id_return_fkey" FOREIGN KEY ("id_return") REFERENCES "returns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_id_order_item_fkey" FOREIGN KEY ("id_order_item") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_id_product_fkey" FOREIGN KEY ("id_product") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "orders"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id_customer") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_id_payment_method_fkey" FOREIGN KEY ("id_payment_method") REFERENCES "payment_method"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dian_e_invoicing" ADD CONSTRAINT "dian_e_invoicing_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "orders"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_rate" ADD CONSTRAINT "shipment_rate_id_shipping_provider_fkey" FOREIGN KEY ("id_shipping_provider") REFERENCES "shipping_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "orders"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment" ADD CONSTRAINT "shipment_id_shipping_provider_fkey" FOREIGN KEY ("id_shipping_provider") REFERENCES "shipping_provider"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracking_history" ADD CONSTRAINT "tracking_history_id_shipment_fkey" FOREIGN KEY ("id_shipment") REFERENCES "shipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
