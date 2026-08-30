const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const sale = await prisma.posSale.findFirst({ orderBy: { id: 'desc' } });
  console.log(JSON.stringify(sale, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
