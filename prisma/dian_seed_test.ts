
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('Sincronizando resoluciones DIAN TEST desde la base de datos actual...');

    // 1. Facturación Electrónica (SETP)
    await prisma.dianResolution.upsert({
      where: { id: 1 },
      update: {
        type: 'INVOICE',
        prefix: 'SETP',
        resolutionNumber: '18760000001',
        startNumber: 990000000,
        endNumber: 995000000,
        currentNumber: 990000025,
        technicalKey: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
        environment: 'TEST',
        isActive: true,
      },
      create: {
        id: 1,
        type: 'INVOICE',
        prefix: 'SETP',
        resolutionNumber: '18760000001',
        startNumber: 990000000,
        endNumber: 995000000,
        currentNumber: 990000025,
        technicalKey: 'fc8eac422eba16e22ffd8c6f94b3f40a6e38162c',
        startDate: new Date('2026-03-11'),
        endDate: new Date('2028-03-11'),
        environment: 'TEST',
        isActive: true,
      },
    });

    // 2. Nota Crédito (NC)
    await prisma.dianResolution.upsert({
      where: { id: 2 },
      update: {
        type: 'CREDIT_NOTE',
        prefix: 'NC',
        currentNumber: 17,
        environment: 'TEST',
        isActive: true,
      },
      create: {
        id: 2,
        type: 'CREDIT_NOTE',
        prefix: 'NC',
        resolutionNumber: '99000000000',
        startNumber: 1,
        endNumber: 999999,
        currentNumber: 17,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-01-01'),
        environment: 'TEST',
        isActive: true,
      },
    });

    // 3. Nota Débito (ND)
    await prisma.dianResolution.upsert({
      where: { id: 3 },
      update: {
        type: 'DEBIT_NOTE',
        prefix: 'ND',
        currentNumber: 6,
        environment: 'TEST',
        isActive: true,
      },
      create: {
        id: 3,
        type: 'DEBIT_NOTE',
        prefix: 'ND',
        resolutionNumber: '99000000000',
        startNumber: 1,
        endNumber: 999999,
        currentNumber: 6,
        startDate: new Date('2020-01-01'),
        endDate: new Date('2030-01-01'),
        environment: 'TEST',
        isActive: true,
      },
    });

    console.log('Respaldo de resoluciones DIAN TEST completado.');
  } catch (error) {
    console.error('Error sincronizando el seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
