-- CreateTable
CREATE TABLE "tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_tag" (
    "id_tag" INTEGER NOT NULL,
    "id_design" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_tag_pkey" PRIMARY KEY ("id_tag","id_design")
);

-- CreateIndex
CREATE UNIQUE INDEX "tag_name_key" ON "tag"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tag_slug_key" ON "tag"("slug");

-- AddForeignKey
ALTER TABLE "design_tag" ADD CONSTRAINT "design_tag_id_design_fkey" FOREIGN KEY ("id_design") REFERENCES "design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_tag" ADD CONSTRAINT "design_tag_id_tag_fkey" FOREIGN KEY ("id_tag") REFERENCES "tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

