-- AlterTable
ALTER TABLE "order" ADD COLUMN     "discount_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "id_coupon" INTEGER;

-- CreateTable
CREATE TABLE "coupon" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "free_shipping" BOOLEAN NOT NULL DEFAULT false,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "is_single_use_per_client" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_uses" INTEGER,
    "current_uses" INTEGER NOT NULL DEFAULT 0,
    "min_purchase_amount" DOUBLE PRECISION,
    "min_items_count" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_usage" (
    "id" SERIAL NOT NULL,
    "id_coupon" INTEGER NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "id_order" INTEGER NOT NULL,
    "used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "coupon_code_key" ON "coupon"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_usage_id_order_key" ON "coupon_usage"("id_order");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_id_coupon_fkey" FOREIGN KEY ("id_coupon") REFERENCES "coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_id_coupon_fkey" FOREIGN KEY ("id_coupon") REFERENCES "coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_usage" ADD CONSTRAINT "coupon_usage_id_order_fkey" FOREIGN KEY ("id_order") REFERENCES "order"("id_order") ON DELETE RESTRICT ON UPDATE CASCADE;

