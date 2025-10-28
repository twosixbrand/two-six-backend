/*
  Warnings:

  - You are about to drop the `usuario` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."user_role" DROP CONSTRAINT "user_role_code_user_fkey";

-- DropTable
DROP TABLE "public"."usuario";

-- CreateTable
CREATE TABLE "user_app" (
    "code_user" SERIAL NOT NULL,
    "login" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_app_pkey" PRIMARY KEY ("code_user")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_app_login_key" ON "user_app"("login");

-- AddForeignKey
ALTER TABLE "user_role" ADD CONSTRAINT "user_role_code_user_fkey" FOREIGN KEY ("code_user") REFERENCES "user_app"("code_user") ON DELETE RESTRICT ON UPDATE CASCADE;
