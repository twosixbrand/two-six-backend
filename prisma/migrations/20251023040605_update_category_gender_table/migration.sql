/*
  Warnings:

  - You are about to drop the column `category` on the `Product` table. All the data in the column will be lost.
  - Added the required column `gender` to the `Product` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('HOMBRE', 'MUJER');

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "category",
ADD COLUMN     "gender" "Gender" NOT NULL;

-- DropEnum
DROP TYPE "public"."Category";
