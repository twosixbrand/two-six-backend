import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed de Contabilidad Local ---');

  // 1. Departamentos y Ciudades (Necesarios para ICA)
  console.log('Poblando ubicaciones...');
  const bogotaDept = await prisma.department.upsert({
    where: { id: 11 },
    update: {},
    create: { id: 11, name: 'BOGOTÁ D.C.' }
  });

  const bogotaCity = await prisma.city.upsert({
    where: { id: 11001 },
    update: {},
    create: {
      id: 11001,
      name: 'BOGOTÁ',
      id_department: bogotaDept.id,
      active: true
    }
  });

  // 2. Cuentas PUC Esenciales (Nivel 5)
  console.log('Poblando cuentas PUC...');
  const accounts = [
    { code: '111005', name: 'Bancos - Moneda Nacional', nature: 'DEBITO' },
    { code: '130505', name: 'Clientes Nacionales', nature: 'DEBITO' },
    { code: '135518', name: 'Anticipo ICA', nature: 'DEBITO' },
    { code: '143501', name: 'Inventario Ropa Terminada', nature: 'DEBITO' },
    { code: '236575', name: 'Autorretención Especial Renta', nature: 'CREDITO' },
    { code: '240801', name: 'IVA Generado 19%', nature: 'CREDITO' },
    { code: '413535', name: 'Venta de Prendas de Vestir', nature: 'CREDITO' },
    { code: '519910', name: 'Gasto Merma / Deterioro', nature: 'DEBITO' },
    { code: '523505', name: 'Gasto Publicidad / Regalos', nature: 'DEBITO' },
    { code: '530505', name: 'Gastos Bancarios / Comisiones', nature: 'DEBITO' },
    // Cuentas PUC requeridas por módulo de Consignación
    { code: '143505', name: 'Inventario Mercancía Propia', nature: 'DEBITO' },
    { code: '143510', name: 'Mercancía en Consignación en Poder de Terceros', nature: 'DEBITO' },
    { code: '429505', name: 'Aprovechamientos', nature: 'CREDITO' },
  ];

  for (const acc of accounts) {
    await prisma.pucAccount.upsert({
      where: { code: acc.code },
      update: {},
      create: {
        code: acc.code,
        name: acc.name,
        nature: acc.nature,
        level: 5,
        accepts_movements: true,
        is_active: true
      }
    });
  }

  const accountMap = await prisma.pucAccount.findMany();
  const getAccId = (code: string) => accountMap.find(a => a.code === code)?.id;

  // 3. Configuración de Impuestos de Prueba
  console.log('Configurando impuestos...');
  await prisma.taxConfiguration.createMany({
    data: [
      {
        name: 'ICA Bogotá (11.04/1000)',
        type: 'ICA',
        city_id: bogotaCity.id,
        rate: 0.01104,
        puc_account_debit: getAccId('519910'),
        puc_account_credit: getAccId('135518'),
      },
      {
        name: 'Autorretención Especial (0.4%)',
        type: 'AUTORETENCION_RENTA',
        rate: 0.004,
        puc_account_debit: getAccId('135518'),
        puc_account_credit: getAccId('236575'),
      }
    ],
    skipDuplicates: true
  });

  // 4. Empleados de Prueba
  console.log('Creando trabajadores...');
  await prisma.employee.upsert({
    where: { document_number: '12345678' },
    update: {},
    create: {
      document_number: '12345678',
      id_identification_type: 1,
      name: 'PEPE PRUEBA RRHH',
      position: 'Operario de Confección',
      hire_date: new Date(),
      base_salary: 1300000,
      transport_allowance: 162000,
      is_exonerated: true,
      contract_type: 'INDEFINIDO',
      arl_risk_level: 1
    }
  });

  console.log('--- Seed Contable Finalizado con Éxito ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
