/*
  Warnings:

  - You are about to drop the `Category_t` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Consecutive_Category` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Category_t";

-- DropTable
DROP TABLE "public"."Consecutive_Category";

-- CreateTable
CREATE TABLE "category" (
    "code_cat" CHAR(2) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("code_cat")
);

-- CreateTable
CREATE TABLE "consecutive_category" (
    "code_con" SERIAL NOT NULL,
    "code_cat" CHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consecutive_category_pkey" PRIMARY KEY ("code_con")
);
