
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const coupons = await prisma.coupon.findMany();
    console.log('Cupones en la base de datos:', JSON.stringify(coupons, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
