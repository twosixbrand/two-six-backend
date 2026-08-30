const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const invoice = await prisma.dianEInvoicing.findFirst({
    where: { document_number: 'TSF9' },
    include: { posSale: true, order: true }
  });
  console.log(JSON.stringify(invoice, null, 2));
  prisma.$disconnect();
}
run();
