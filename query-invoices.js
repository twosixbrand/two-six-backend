const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const invoices = await prisma.dianEInvoicing.findMany({
    orderBy: { id: 'desc' },
    take: 5
  });
  console.log(JSON.stringify(invoices, null, 2));
  prisma.$disconnect();
}
run();
