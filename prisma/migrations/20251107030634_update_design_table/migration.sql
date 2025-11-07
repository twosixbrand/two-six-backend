/*
  Warnings:

  - You are about to drop the column `id_year_production` on the `design` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `design` table. All the data in the column will be lost.
  - Added the required column `quantity` to the `design` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."design" DROP CONSTRAINT "design_id_year_production_fkey";

-- AlterTable
ALTER TABLE "design" DROP COLUMN "id_year_production",
DROP COLUMN "name",
ADD COLUMN     "quantity" BIGINT NOT NULL;
