/*
  Warnings:

  - You are about to drop the column `season` on the `collection` table. All the data in the column will be lost.
  - Added the required column `id_season` to the `collection` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "collection" DROP COLUMN "season",
ADD COLUMN     "id_season" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "season" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "season_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "season_name_key" ON "season"("name");

-- AddForeignKey
ALTER TABLE "collection" ADD CONSTRAINT "collection_id_season_fkey" FOREIGN KEY ("id_season") REFERENCES "season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
