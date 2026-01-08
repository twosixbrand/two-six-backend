-- AlterTable
ALTER TABLE "customer" ADD COLUMN     "otp" TEXT,
ADD COLUMN     "otp_expires_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "address" (
    "id" SERIAL NOT NULL,
    "id_customer" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "detail" TEXT,
    "instructions" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "shipping_cost" INTEGER NOT NULL DEFAULT 0,
    "id_department" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "department_name_key" ON "department"("name");

-- AddForeignKey
ALTER TABLE "address" ADD CONSTRAINT "address_id_customer_fkey" FOREIGN KEY ("id_customer") REFERENCES "customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "city" ADD CONSTRAINT "city_id_department_fkey" FOREIGN KEY ("id_department") REFERENCES "department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
