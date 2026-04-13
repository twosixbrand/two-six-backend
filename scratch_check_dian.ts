
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    const resolutions = await prisma.dianResolution.findMany();
    console.log('Resoluciones DIAN:', JSON.stringify(resolutions, null, 2));
    
    const env = process.env.DIAN_ENVIRONMENT || 'TEST';
    const activeResolution = await prisma.dianResolution.findFirst({
      where: { isActive: true, environment: env, type: 'INVOICE' },
    });
    console.log(`Resolución Activa para ${env}:`, JSON.stringify(activeResolution, null, 2));

    const pendingInvoices = await prisma.dianEInvoicing.findMany({
      where: { status: 'SENT' },
    });
    console.log('Facturas SENT (pendientes de polling):', pendingInvoices.length);
    
    const recentInvoices = await prisma.dianEInvoicing.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    console.log('Facturas recientes:', JSON.stringify(recentInvoices, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
