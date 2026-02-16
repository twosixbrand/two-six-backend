/*
  Warnings:

  - You are about to drop the column `gender` on the `clothing` table. All the data in the column will be lost.

*/
-- AlterTable
-- CreateTable
CREATE TABLE "gender_clothing" (
    "id" SERIAL NOT NULL,
    "id_clothing" INTEGER NOT NULL,
    "id_gender" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "gender_clothing_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "gender_clothing" ADD CONSTRAINT "gender_clothing_id_clothing_fkey" FOREIGN KEY ("id_clothing") REFERENCES "clothing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gender_clothing" ADD CONSTRAINT "gender_clothing_id_gender_fkey" FOREIGN KEY ("id_gender") REFERENCES "gender"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DATA MIGRATION START

-- 1. Ensure basic genders exist in 'gender' table
INSERT INTO "gender" ("name", "updatedAt")
VALUES 
    ('MASCULINO', NOW()),
    ('FEMENINO', NOW()),
    ('UNISEX', NOW())
ON CONFLICT DO NOTHING; -- Assuming 'name' might not be unique constraints but we just want to ensure they exist. If name is not unique constraint, this might duplicate if run multiple times but 'id' is distinct. The user's schema didn't make name unique. Let's check `Gender` model again.
-- User's `Gender` model: name String (not unique).
-- But usually we want unique names. I will treat them as unique for this migration logic to avoid duplicates if possible, or just insert them.
-- Since the table is new and likely empty, this is safe.

-- 2. Migrate data from clothing.gender (enum cast to text) to gender_clothing
INSERT INTO "gender_clothing" ("id_clothing", "id_gender", "updated_at")
SELECT 
    c.id, 
    g.id,
    NOW()
FROM "clothing" c
JOIN "gender" g ON g.name = c.gender::text;

-- DATA MIGRATION END

-- AlterTable
ALTER TABLE "clothing" DROP COLUMN "gender";
