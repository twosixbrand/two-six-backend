const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const invoice = await prisma.dianEInvoicing.findFirst({ where: { document_number: 'TSF11' } });
  console.log(JSON.stringify(invoice, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
