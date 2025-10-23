/*
  Warnings:

  - Added the required column `updatedAt` to the `Category_t` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Collection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Category_t" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "Consecutive_Category" (
    "code_con" SERIAL NOT NULL,
    "code_cat" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consecutive_Category_pkey" PRIMARY KEY ("code_con")
);

-- CreateTable
CREATE TABLE "Year_Production" (
    "code_year" CHAR(1) NOT NULL,
    "year" CHAR(4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Year_Production_pkey" PRIMARY KEY ("code_year")
);

-- CreateTable
CREATE TABLE "Reference" (
    "ref" CHAR(7) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reference_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "Consecutive_Reference" (
    "code_con" SERIAL NOT NULL,
    "ref" TEXT NOT NULL,

    CONSTRAINT "Consecutive_Reference_pkey" PRIMARY KEY ("code_con")
);
