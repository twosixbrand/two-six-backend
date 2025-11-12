/*
  Warnings:

  - You are about to drop the column `id_provider` on the `design` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "design" DROP CONSTRAINT "design_id_provider_fkey";

-- AlterTable
ALTER TABLE "design" DROP COLUMN "id_provider";

-- CreateTable
CREATE TABLE "production_type" (
    "id_production_type" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_type_pkey" PRIMARY KEY ("id_production_type")
);

-- CreateTable
CREATE TABLE "design_provider" (
    "id" SERIAL NOT NULL,
    "id_design" INTEGER NOT NULL,
    "id_provider" TEXT NOT NULL,
    "id_production_type" INTEGER NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "price" DECIMAL(65,30) NOT NULL,
    "rating" INTEGER,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "design_provider_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "design_provider" ADD CONSTRAINT "design_provider_id_design_fkey" FOREIGN KEY ("id_design") REFERENCES "design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_provider" ADD CONSTRAINT "design_provider_id_provider_fkey" FOREIGN KEY ("id_provider") REFERENCES "provider"("nit") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_provider" ADD CONSTRAINT "design_provider_id_production_type_fkey" FOREIGN KEY ("id_production_type") REFERENCES "production_type"("id_production_type") ON DELETE RESTRICT ON UPDATE CASCADE;
