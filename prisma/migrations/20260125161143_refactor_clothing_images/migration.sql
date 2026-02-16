/*
  Warnings:

  - You are about to drop the column `image_url` on the `clothing_color` table. All the data in the column will be lost.
  - Added the required column `id_gender` to the `clothing_color` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "clothing_color" DROP COLUMN "image_url",
ADD COLUMN     "id_gender" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "image_clothing" (
    "id_image_clothing" SERIAL NOT NULL,
    "id_clothing_color" INTEGER NOT NULL,
    "image_url" TEXT,
    "position" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "image_clothing_pkey" PRIMARY KEY ("id_image_clothing")
);

-- AddForeignKey
ALTER TABLE "clothing_color" ADD CONSTRAINT "clothing_color_id_gender_fkey" FOREIGN KEY ("id_gender") REFERENCES "gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "image_clothing" ADD CONSTRAINT "image_clothing_id_clothing_color_fkey" FOREIGN KEY ("id_clothing_color") REFERENCES "clothing_color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
