/*
  Warnings:

  - Changed the type of `gender` on the `clothing` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "GenderEnum" AS ENUM ('MASCULINO', 'FEMENINO', 'UNISEX');

-- AlterTable
ALTER TABLE "clothing" ALTER COLUMN "gender" TYPE "GenderEnum" USING "gender"::text::"GenderEnum";

-- DropEnum
DROP TYPE "Gender";

-- CreateTable
CREATE TABLE "gender" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "gender_pkey" PRIMARY KEY ("id")
);
