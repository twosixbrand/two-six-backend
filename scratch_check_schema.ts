
import { PrismaClient } from '@prisma/client';

async function checkSchema() {
  const prisma = new PrismaClient();
  try {
    const tableInfo = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'coupon'
    `;
    console.log('Estructura de la tabla coupon:', JSON.stringify(tableInfo, null, 2));
    
    const count = await prisma.coupon.count();
    console.log('Total cupones:', count);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();
