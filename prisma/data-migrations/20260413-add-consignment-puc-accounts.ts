/**
 * Data migration: cuentas PUC requeridas por el módulo de Consignación (F01-F08).
 *
 * Agrega (idempotente, vía upsert) las siguientes cuentas al PUC:
 *  - 143505  Inventario Mercancía Propia (DEBITO)  — usada por journal-auto.service.ts como cuenta preferida
 *  - 143510  Mercancía en Consignación en Poder de Terceros (DEBITO) — reclass de inventario al despachar
 *  - 429505  Aprovechamientos (Otros Ingresos) (CREDITO) — sobrantes de conteo cíclico y facturación de merma
 *
 * Uso:
 *   npx ts-node prisma/data-migrations/20260413-add-consignment-puc-accounts.ts
 *
 * Seguro de correr múltiples veces: upsert con clave única `code`, no modifica datos existentes.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedAccount {
  code: string;
  name: string;
  nature: 'DEBITO' | 'CREDITO';
  parent_code: string | null;
  level: number;
}

const parents: SeedAccount[] = [
  // Asegura padres si no existen (upsert no los inserta fuera de aquí)
  { code: '14', name: 'Inventarios', nature: 'DEBITO', parent_code: '1', level: 2 },
  { code: '1435', name: 'Mercancías no fabricadas por la empresa', nature: 'DEBITO', parent_code: '14', level: 3 },
  { code: '42', name: 'No Operacionales', nature: 'CREDITO', parent_code: '4', level: 2 },
  { code: '4295', name: 'Diversos', nature: 'CREDITO', parent_code: '42', level: 3 },
];

const newAccounts: SeedAccount[] = [
  {
    code: '143505',
    name: 'Inventario Mercancía Propia',
    nature: 'DEBITO',
    parent_code: '1435',
    level: 5,
  },
  {
    code: '143510',
    name: 'Mercancía en Consignación en Poder de Terceros',
    nature: 'DEBITO',
    parent_code: '1435',
    level: 5,
  },
  {
    code: '429505',
    name: 'Aprovechamientos',
    nature: 'CREDITO',
    parent_code: '4295',
    level: 5,
  },
];

async function main() {
  console.log('--- Data migration: cuentas PUC Consignación ---');

  // 1. Padres (sin mover registros existentes)
  for (const acc of parents) {
    await prisma.pucAccount.upsert({
      where: { code: acc.code },
      update: {}, // no tocar si ya existe
      create: {
        code: acc.code,
        name: acc.name,
        nature: acc.nature,
        parent_code: acc.parent_code,
        level: acc.level,
        accepts_movements: false,
        is_active: true,
      },
    });
    console.log(`  · padre ${acc.code} verificado`);
  }

  // 2. Cuentas de movimiento nuevas
  for (const acc of newAccounts) {
    const result = await prisma.pucAccount.upsert({
      where: { code: acc.code },
      update: {}, // no sobrescribir si ya existe con otra descripción
      create: {
        code: acc.code,
        name: acc.name,
        nature: acc.nature,
        parent_code: acc.parent_code,
        level: acc.level,
        accepts_movements: true,
        is_active: true,
      },
    });
    console.log(`  ✓ ${result.code}  ${result.name}`);
  }

  console.log('--- Finalizado ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
