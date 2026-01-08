-- DropForeignKey
ALTER TABLE "design_clothing" DROP CONSTRAINT "design_clothing_id_color_fkey";
ALTER TABLE "design_clothing" DROP CONSTRAINT "design_clothing_id_design_fkey";
ALTER TABLE "design_clothing" DROP CONSTRAINT "design_clothing_id_size_fkey";
ALTER TABLE "product" DROP CONSTRAINT "product_id_design_clothing_fkey";
ALTER TABLE "stock" DROP CONSTRAINT "stock_id_design_clothing_fkey";

-- Rename Table
ALTER TABLE "design_clothing" RENAME TO "clothing_color";

-- Rename PK Constraint
ALTER TABLE "clothing_color" RENAME CONSTRAINT "design_clothing_pkey" TO "clothing_color_pkey";

-- Rename Columns
ALTER TABLE "product" RENAME COLUMN "id_design_clothing" TO "id_clothing_color";
ALTER TABLE "stock" RENAME COLUMN "id_design_clothing" TO "id_clothing_color";

-- Rename Indexes
ALTER INDEX "product_id_design_clothing_key" RENAME TO "product_id_clothing_color_key";
ALTER INDEX "stock_id_design_clothing_key" RENAME TO "stock_id_clothing_color_key";

-- AddForeignKey
ALTER TABLE "clothing_color" ADD CONSTRAINT "clothing_color_id_color_fkey" FOREIGN KEY ("id_color") REFERENCES "color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clothing_color" ADD CONSTRAINT "clothing_color_id_size_fkey" FOREIGN KEY ("id_size") REFERENCES "size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "clothing_color" ADD CONSTRAINT "clothing_color_id_design_fkey" FOREIGN KEY ("id_design") REFERENCES "design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "stock" ADD CONSTRAINT "stock_id_clothing_color_fkey" FOREIGN KEY ("id_clothing_color") REFERENCES "clothing_color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "product" ADD CONSTRAINT "product_id_clothing_color_fkey" FOREIGN KEY ("id_clothing_color") REFERENCES "clothing_color"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
