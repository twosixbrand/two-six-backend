-- CreateTable
CREATE TABLE "Collection" (
    "code_col" CHAR(1) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(200),

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("code_col")
);
