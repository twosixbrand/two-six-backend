const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const parents = [
  { code: '14', name: 'Inventarios', parent_code: '1', level: 2 },
  { code: '1435', name: 'Mercancías no fabricadas por la empresa', parent_code: '14', level: 3 },
  { code: '42', name: 'No Operacionales', parent_code: '4', level: 2 },
  { code: '4295', name: 'Diversos', parent_code: '42', level: 3 },
];

const accounts = [
  { code: '143505', name: 'Inventario Mercancía Propia', nature: 'DEBITO', parent_code: '1435', level: 5 },
  { code: '143510', name: 'Mercancía en Consignación en Poder de Terceros', nature: 'DEBITO', parent_code: '1435', level: 5 },
  { code: '429505', name: 'Aprovechamientos', nature: 'CREDITO', parent_code: '4295', level: 5 },
];

async function main() {
  console.log('--- Data migration: cuentas PUC Consignación ---');
  for (const acc of parents) {
    await prisma.pucAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: { code: acc.code, name: acc.name, nature: 'DEBITO', parent_code: acc.parent_code, level: acc.level, accepts_movements: false, is_active: true },
    });
    console.log(`  padre ${acc.code} verificado`);
  }
  for (const acc of accounts) {
    const result = await prisma.pucAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: { code: acc.code, name: acc.name, nature: acc.nature, parent_code: acc.parent_code, level: acc.level, accepts_movements: true, is_active: true },
    });
    console.log(`  ✓ ${result.code}  ${result.name}`);
  }
  console.log('--- Finalizado ---');
}

main().catch(console.error).finally(() => prisma.$disconnect());
