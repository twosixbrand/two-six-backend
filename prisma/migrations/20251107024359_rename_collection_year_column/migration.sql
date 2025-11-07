/*
  Warnings:

  - Added the required column `id_year_production` to the `collection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collection" ADD COLUMN     "id_year_production" CHAR(2) NOT NULL;

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_id_year_production_fkey" FOREIGN KEY ("id_year_production") REFERENCES "year_production"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
