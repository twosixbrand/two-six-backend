const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const invoices = await prisma.dianEInvoicing.findMany({
    select: { id: true, document_number: true }
  });
  console.log(invoices);
  prisma.$disconnect();
}
run();
