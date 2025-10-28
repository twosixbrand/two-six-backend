/*
  Warnings:

  - You are about to drop the `Category` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Clothing` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Collection` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Consecutive_Reference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Reference` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Year_Production` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."Category";

-- DropTable
DROP TABLE "public"."Clothing";

-- DropTable
DROP TABLE "public"."Collection";

-- DropTable
DROP TABLE "public"."Consecutive_Reference";

-- DropTable
DROP TABLE "public"."Reference";

-- DropTable
DROP TABLE "public"."Year_Production";

-- CreateTable
CREATE TABLE "usuario" (
    "code_user" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("code_user")
);

-- CreateTable
CREATE TABLE "role" (
    "code_role" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("code_role")
);

-- CreateTable
CREATE TABLE "user_role" (
    "code_user_role" SERIAL NOT NULL,
    "code_user" INTEGER NOT NULL,
    "code_role" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_role_pkey" PRIMARY KEY ("code_user_role")
);

-- CreateTable
CREATE TABLE "collection" (
    "code_col" CHAR(1) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collection_pkey" PRIMARY KEY ("code_col")
);

-- CreateTable
CREATE TABLE "category" (
    "code_cat" VARCHAR(2) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_pkey" PRIMARY KEY ("code_cat")
);

-- CreateTable
CREATE TABLE "year_production" (
    "code_year" CHAR(1) NOT NULL,
    "year" CHAR(4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "year_production_pkey" PRIMARY KEY ("code_year")
);

-- CreateTable
CREATE TABLE "reference" (
    "ref" CHAR(7) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reference_pkey" PRIMARY KEY ("ref")
);

-- CreateTable
CREATE TABLE "consecutive_reference" (
    "code_con" SERIAL NOT NULL,
    "ref" TEXT NOT NULL,

    CONSTRAINT "consecutive_reference_pkey" PRIMARY KEY ("code_con")
);

-- CreateTable
CREATE TABLE "clothing" (
    "id" CHAR(2) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "clothing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_login_key" ON "usuario"("login");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_code_user_fkey" FOREIGN KEY ("code_user") REFERENCES "usuario"("code_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_code_role_fkey" FOREIGN KEY ("code_role") REFERENCES "role"("code_role") ON DELETE RESTRICT ON UPDATE CASCADE;
