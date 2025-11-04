/*
  Warnings:

  - Added the required column `gender` to the `clothing` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hex` to the `color` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MASCULINO', 'FEMENINO', 'UNISEX');

-- AlterTable
ALTER TABLE "clothing" ADD COLUMN     "gender" "Gender" NOT NULL;

-- AlterTable
ALTER TABLE "color" ADD COLUMN     "hex" TEXT NOT NULL;
