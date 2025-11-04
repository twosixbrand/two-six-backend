/*
  Warnings:

  - You are about to drop the column `contraindication_image_url` on the `product` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "category" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "clothing" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "collection" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "color" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "customer" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "customer_type" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "design" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "design_clothing" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "dian_e_invoicing" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "identification_type" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "log_error" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "orders" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payment_method" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "product" DROP COLUMN "contraindication_image_url",
DROP COLUMN "created_at",
ADD COLUMN     " screated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "consecutive_number" TEXT,
ADD COLUMN     "image_url" TEXT,
ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "provider" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "return_items" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "returns" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "role" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shipment" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shipment_rate" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "shipping_provider" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "size" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "stock" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "tracking_history" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "type_clothing" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_app" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "user_role" ALTER COLUMN "updated_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "year_production" ALTER COLUMN "updated_at" DROP NOT NULL;
