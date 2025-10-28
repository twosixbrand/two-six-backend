/*
  Warnings:

  - The primary key for the `category` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "category" DROP CONSTRAINT "category_pkey",
ALTER COLUMN "code_cat" SET DATA TYPE VARCHAR(2),
ADD CONSTRAINT "category_pkey" PRIMARY KEY ("code_cat");

-- AlterTable
ALTER TABLE "consecutive_category" ALTER COLUMN "code_cat" SET DATA TYPE VARCHAR(2);
