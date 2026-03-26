import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const inv = await prisma.dianEInvoicing.findFirst({
    where: { document_number: 'SETP990000015' }
  });
  console.log('Invoice:', inv);
}
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
