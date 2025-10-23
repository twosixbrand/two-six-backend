-- CreateTable
CREATE TABLE "Category_t" (
    "code_cat" CHAR(2) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),

    CONSTRAINT "Category_t_pkey" PRIMARY KEY ("code_cat")
);
