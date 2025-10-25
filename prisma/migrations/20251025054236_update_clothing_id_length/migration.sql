/*
  Warnings:

  - The primary key for the `Clothing` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "Clothing" DROP CONSTRAINT "Clothing_pkey",
ALTER COLUMN "id" SET DATA TYPE CHAR(2),
ADD CONSTRAINT "Clothing_pkey" PRIMARY KEY ("id");
