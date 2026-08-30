const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "dian_e_invoicing" ADD COLUMN IF NOT EXISTS "dian_xml_content" TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "dian_e_invoicing" ALTER COLUMN "dian_response" TYPE TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "dian_e_invoicing" ALTER COLUMN "dian_zip_base64" TYPE TEXT;`);
    console.log("Database updated successfully");
  } catch (e) {
    console.error("Error updating database:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
