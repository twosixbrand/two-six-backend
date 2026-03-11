import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const orders = await prisma.order.findMany({
    select: { id: true, order_reference: true, createdAt: true },
    take: 5,
    orderBy: { id: 'desc' }
  });
  console.log("Recent Orders:");
  console.table(orders);

  // Check unique constraints
  const uniqueRefs = new Set(orders.map(o => o.order_reference));
  console.log(`Unique refs: ${uniqueRefs.size} / Total sampled: ${orders.length}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
