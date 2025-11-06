/*
  Warnings:

  - You are about to alter the column `id_type_clothing` on the `clothing` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Char(2)`.
  - You are about to alter the column `id_year_production` on the `design` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Char(2)`.
  - The primary key for the `type_clothing` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `type_clothing` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Char(2)`.
  - The primary key for the `year_production` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `year_production` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Char(2)`.
  - Added the required column `code` to the `identification_type` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."clothing" DROP CONSTRAINT "clothing_id_type_clothing_fkey";

-- DropForeignKey
ALTER TABLE "public"."design" DROP CONSTRAINT "design_id_year_production_fkey";

-- AlterTable
ALTER TABLE "clothing" ALTER COLUMN "id_type_clothing" SET DATA TYPE CHAR(2);

-- AlterTable
ALTER TABLE "design" ALTER COLUMN "id_year_production" SET DATA TYPE CHAR(2);

-- AlterTable
ALTER TABLE "identification_type" ADD COLUMN     "code" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "type_clothing" DROP CONSTRAINT "type_clothing_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE CHAR(2),
ADD CONSTRAINT "type_clothing_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "type_clothing_id_seq";

-- AlterTable
ALTER TABLE "year_production" DROP CONSTRAINT "year_production_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE CHAR(2),
ADD CONSTRAINT "year_production_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "year_production_id_seq";

-- AddForeignKey
ALTER TABLE "clothing" ADD CONSTRAINT "clothing_id_type_clothing_fkey" FOREIGN KEY ("id_type_clothing") REFERENCES "type_clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design" ADD CONSTRAINT "design_id_year_production_fkey" FOREIGN KEY ("id_year_production") REFERENCES "year_production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
