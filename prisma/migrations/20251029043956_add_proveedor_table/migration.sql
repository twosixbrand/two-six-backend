/*
  Warnings:

  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('HOMBRE', 'MUJER');

-- DropForeignKey
ALTER TABLE "public"."user_role" DROP CONSTRAINT "user_role_code_user_fkey";

-- DropTable
DROP TABLE "public"."usuario";

-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "isOutlet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "error_log" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "componentStack" TEXT,
    "app" VARCHAR(4),
    "page" VARCHAR(20),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "consecutive_category" (
    "code_con" SERIAL NOT NULL,
    "code_cat" VARCHAR(2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consecutive_category_pkey" PRIMARY KEY ("code_con")
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

-- CreateTable
CREATE TABLE "Type_Clothing" (
    "code" CHAR(1) NOT NULL,
    "name" VARCHAR(30) NOT NULL,

    CONSTRAINT "Type_Clothing_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "user_app" (
    "code_user" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_app_pkey" PRIMARY KEY ("code_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_app_login_key" ON "user_app"("login");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_code_user_fkey" FOREIGN KEY ("code_user") REFERENCES "user_app"("code_user") ON DELETE RESTRICT ON UPDATE CASCADE;
