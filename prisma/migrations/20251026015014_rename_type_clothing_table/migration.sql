/*
  Warnings:

  - You are about to drop the `type_clothing` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."type_clothing";

-- CreateTable
CREATE TABLE "Type_Clothing" (
    "code" CHAR(1) NOT NULL,
    "name" VARCHAR(30) NOT NULL,

    CONSTRAINT "Type_Clothing_pkey" PRIMARY KEY ("code")
);
