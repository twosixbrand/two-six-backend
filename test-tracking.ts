import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkOrder() {
  const order = await prisma.order.findFirst({
    include: {
      customer: true,
      payments: true,
      shipments: true
    },
    orderBy: {
      order_date: 'desc'
    }
  });
  console.log("Last Order:", JSON.stringify(order, null, 2));
}

checkOrder()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
