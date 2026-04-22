/**
 * Data migration: PUC ampliado + configuración de retenciones (ReteIVA, ReteICA).
 *
 * Agrega (idempotente vía upsert) ~80 cuentas PUC clave que faltaban para
 * cubrir los rubros básicos de una empresa comercial colombiana:
 *  - Activos fijos completos (clase 15)
 *  - Intangibles (clase 17)
 *  - Diferidos (clase 18)
 *  - Pasivos LP (clase 21)
 *  - Retenciones por pagar adicionales (2367 ReteIVA, 2368 ReteICA)
 *  - Patrimonio completo (clase 33, 36)
 *  - Ingresos operacionales y no operacionales adicionales (4135xx, 42xx)
 *  - Gastos por área (51xx, 52xx, 53xx)
 *  - Costos detallados (6135xx)
 *
 * También crea las configuraciones por defecto de TaxConfiguration para
 * ReteIVA (15% del IVA) y ReteICA (Bogotá 11.04/1000), apuntando a las
 * cuentas PUC correspondientes.
 *
 * Uso:
 *   npx ts-node prisma/data-migrations/20260414-extended-puc-and-retentions.ts
 *
 * Idempotente: seguro de correr múltiples veces. Upsert con clave única `code`,
 * y skipDuplicates en taxConfiguration.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type AccTuple = [code: string, name: string, parent: string | null, nature: 'D' | 'C', accepts: boolean];

const accounts: AccTuple[] = [
  // ====== ACTIVO FIJO (clase 15) ======
  ['15', 'Propiedad, Planta y Equipo', '1', 'D', false],
  ['1504', 'Terrenos', '15', 'D', false],
  ['150405', 'Urbanos', '1504', 'D', true],
  ['1516', 'Construcciones y Edificaciones', '15', 'D', false],
  ['151605', 'Edificios', '1516', 'D', true],
  ['1520', 'Maquinaria y Equipo', '15', 'D', false],
  ['152005', 'Maquinaria y Equipo', '1520', 'D', true],
  ['1524', 'Equipo de Oficina', '15', 'D', false],
  ['152405', 'Muebles y Enseres', '1524', 'D', true],
  ['1528', 'Equipo de Cómputo y Comunicación', '15', 'D', false],
  ['152805', 'Equipos de Procesamiento de Datos', '1528', 'D', true],
  ['152810', 'Equipos de Telecomunicaciones', '1528', 'D', true],
  ['1540', 'Flota y Equipo de Transporte', '15', 'D', false],
  ['154005', 'Autos, Camionetas y Camperos', '1540', 'D', true],
  ['1592', 'Depreciación Acumulada', '15', 'C', false],
  ['159215', 'Construcciones y Edificaciones', '1592', 'C', true],
  ['159220', 'Maquinaria y Equipo', '1592', 'C', true],
  ['159224', 'Equipo de Oficina', '1592', 'C', true],
  ['159228', 'Equipo de Cómputo', '1592', 'C', true],
  ['159240', 'Flota y Equipo de Transporte', '1592', 'C', true],

  // ====== INTANGIBLES (clase 17) ======
  ['17', 'Intangibles', '1', 'D', false],
  ['1710', 'Marcas', '17', 'D', false],
  ['171005', 'Adquiridas', '1710', 'D', true],
  ['1715', 'Patentes', '17', 'D', false],
  ['171505', 'Adquiridas', '1715', 'D', true],
  ['1730', 'Licencias', '17', 'D', false],
  ['173005', 'Software', '1730', 'D', true],
  ['1798', 'Amortización Acumulada', '17', 'C', false],
  ['179805', 'Marcas', '1798', 'C', true],
  ['179810', 'Software', '1798', 'C', true],

  // ====== DIFERIDOS (clase 18) ======
  ['18', 'Diferidos', '1', 'D', false],
  ['1705', 'Gastos Pagados por Anticipado', '17', 'D', false],
  ['170505', 'Intereses', '1705', 'D', true],
  ['170510', 'Honorarios', '1705', 'D', true],
  ['170520', 'Seguros y Fianzas', '1705', 'D', true],
  ['170525', 'Arrendamientos', '1705', 'D', true],

  // ====== PASIVOS LP (clase 21) ======
  ['2105', 'Bancos Nacionales', '21', 'C', false],
  ['210505', 'Sobregiros', '2105', 'C', true],
  ['210510', 'Pagarés', '2105', 'C', true],
  ['2120', 'Compañías de Financiamiento', '21', 'C', false],
  ['212005', 'Pagarés', '2120', 'C', true],

  // ====== RETENCIONES POR PAGAR ADICIONALES (23) ======
  ['2367', 'Impuesto a las Ventas Retenido (ReteIVA)', '23', 'C', false],
  ['236701', 'IVA Retenido al 15%', '2367', 'C', true],
  ['2368', 'Impuesto de Industria y Comercio Retenido (ReteICA)', '23', 'C', false],
  ['236801', 'ReteICA por compras', '2368', 'C', true],
  ['236802', 'ReteICA por ventas', '2368', 'C', true],

  // ====== PATRIMONIO (clase 3 ampliada) ======
  ['33', 'Reservas', '3', 'C', false],
  ['3305', 'Reservas Obligatorias', '33', 'C', false],
  ['330505', 'Reserva Legal', '3305', 'C', true],
  ['3315', 'Reservas Estatutarias', '33', 'C', false],
  ['331505', 'Para Futuras Capitalizaciones', '3315', 'C', true],
  ['37', 'Resultados de Ejercicios Anteriores', '3', 'C', false],
  ['3705', 'Utilidades Acumuladas', '37', 'C', true],
  ['3710', 'Pérdidas Acumuladas', '37', 'D', true],

  // ====== INGRESOS (clase 4 ampliada) ======
  ['413530', 'Comercio al por menor de prendas de vestir y accesorios', '4135', 'C', true],
  ['4175', 'Devoluciones, Rebajas y Descuentos en Ventas', '41', 'D', false],
  ['417524', 'Devoluciones - Productos Textiles', '4175', 'D', true],
  ['4250', 'Recuperaciones', '42', 'C', false],
  ['425005', 'Recuperaciones de provisiones', '4250', 'C', true],
  ['4255', 'Indemnizaciones', '42', 'C', false],
  ['425505', 'Indemnización por seguros', '4255', 'C', true],

  // ====== GASTOS (clase 5 ampliada) ======
  ['5105', 'Gastos de Personal Administración', '51', 'D', false],
  ['510506', 'Sueldos', '5105', 'D', true],
  ['510527', 'Auxilio de transporte', '5105', 'D', true],
  ['510530', 'Cesantías', '5105', 'D', true],
  ['510536', 'Prima de servicios', '5105', 'D', true],
  ['510539', 'Vacaciones', '5105', 'D', true],
  ['510568', 'Aportes ARL', '5105', 'D', true],
  ['510569', 'Aportes EPS', '5105', 'D', true],
  ['510570', 'Aportes a Fondos de Pensiones', '5105', 'D', true],
  ['510575', 'Aportes Caja de Compensación Familiar', '5105', 'D', true],
  ['510578', 'Aportes ICBF', '5105', 'D', true],
  ['510581', 'Aportes SENA', '5105', 'D', true],
  ['5110', 'Honorarios', '51', 'D', false],
  ['511005', 'Junta Directiva', '5110', 'D', true],
  ['511010', 'Revisoría Fiscal', '5110', 'D', true],
  ['511015', 'Asesoría Jurídica', '5110', 'D', true],
  ['5115', 'Impuestos', '51', 'D', false],
  ['511505', 'Industria y Comercio (ICA)', '5115', 'D', true],
  ['511515', 'Predial', '5115', 'D', true],
  ['5120', 'Arrendamientos', '51', 'D', false],
  ['512010', 'Construcciones y Edificaciones', '5120', 'D', true],
  ['5135', 'Servicios', '51', 'D', false],
  ['513505', 'Aseo y Vigilancia', '5135', 'D', true],
  ['513525', 'Acueducto y Alcantarillado', '5135', 'D', true],
  ['513530', 'Energía Eléctrica', '5135', 'D', true],
  ['513535', 'Teléfono', '5135', 'D', true],
  ['513540', 'Internet', '5135', 'D', true],
  ['5160', 'Depreciaciones', '51', 'D', false],
  ['516010', 'Construcciones y Edificaciones', '5160', 'D', true],
  ['516020', 'Maquinaria y Equipo', '5160', 'D', true],
  ['516024', 'Equipo de Oficina', '5160', 'D', true],
  ['516028', 'Equipo de Cómputo', '5160', 'D', true],
  ['516040', 'Flota y Equipo de Transporte', '5160', 'D', true],
  ['5165', 'Amortizaciones', '51', 'D', false],
  ['516510', 'Software', '5165', 'D', true],
];

const taxConfigs = [
  {
    name: 'ReteIVA 15% sobre IVA',
    type: 'RETEIVA',
    rate: 0.15,
    debit_code: '236701',
    credit_code: '236701',
    city_code: null,
  },
  {
    name: 'ReteICA Bogotá 11.04/1000 (compras)',
    type: 'RETEICA',
    rate: 0.01104,
    debit_code: '236801',
    credit_code: '236801',
    city_code: 'BOGOTÁ',
  },
];

const inferLevel = (code: string): number => {
  const len = code.length;
  if (len === 1) return 1;
  if (len === 2) return 2;
  if (len <= 4) return 3;
  if (len <= 6) return 4;
  return 5;
};

async function main() {
  console.log('--- Data migration: PUC ampliado + retenciones ---');

  let createdCount = 0;
  let skippedCount = 0;

  for (const [code, name, parent_code, natureChar, accepts_movements] of accounts) {
    const existing = await prisma.pucAccount.findUnique({ where: { code } });
    if (existing) {
      skippedCount++;
      continue;
    }
    await prisma.pucAccount.create({
      data: {
        code,
        name,
        nature: natureChar === 'D' ? 'DEBITO' : 'CREDITO',
        parent_code,
        level: inferLevel(code),
        accepts_movements,
        is_active: true,
      },
    });
    createdCount++;
    console.log(`  ✓ ${code}  ${name}`);
  }

  console.log(`PUC: ${createdCount} cuentas creadas, ${skippedCount} ya existían.`);

  // ====== Configuraciones de impuestos ======
  console.log('Configurando retenciones...');
  const accountByCode = new Map<string, number>();
  const allAccounts = await prisma.pucAccount.findMany({ select: { code: true, id: true } });
  for (const a of allAccounts) accountByCode.set(a.code, a.id);

  for (const tc of taxConfigs) {
    const debitId = accountByCode.get(tc.debit_code);
    const creditId = accountByCode.get(tc.credit_code);
    if (!debitId || !creditId) {
      console.warn(`  ⚠️  Skip ${tc.name}: cuentas ${tc.debit_code}/${tc.credit_code} no encontradas.`);
      continue;
    }

    let cityId: number | undefined;
    if (tc.city_code) {
      const city = await prisma.city.findFirst({ where: { name: tc.city_code } });
      cityId = city?.id;
    }

    const exists = await prisma.taxConfiguration.findFirst({
      where: { name: tc.name, type: tc.type as any },
    });
    if (exists) {
      console.log(`  · ${tc.name} ya existe`);
      continue;
    }

    await prisma.taxConfiguration.create({
      data: {
        name: tc.name,
        type: tc.type as any,
        rate: tc.rate,
        puc_account_debit: debitId,
        puc_account_credit: creditId,
        ...(cityId && { city_id: cityId }),
      },
    });
    console.log(`  ✓ ${tc.name}`);
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
