/*
  Warnings:

  - You are about to drop the `ErrorLog` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."ErrorLog";

-- CreateTable
CREATE TABLE "error_log" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "error_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clothing" (
    "id" CHAR(1) NOT NULL,
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "Clothing_pkey" PRIMARY KEY ("id")
);
