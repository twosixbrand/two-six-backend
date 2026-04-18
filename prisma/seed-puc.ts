import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pucBase = [
  // 1. ACTIVOS (Débito)
  { code: '1', name: 'Activo', parent_code: null, nature: 'D' },
  { code: '11', name: 'Disponible', parent_code: '1', nature: 'D' },
  { code: '1105', name: 'Caja', parent_code: '11', nature: 'D' },
  { code: '110505', name: 'Caja General', parent_code: '1105', nature: 'D' },
  { code: '1110', name: 'Bancos', parent_code: '11', nature: 'D' },
  { code: '111005', name: 'Moneda Nacional', parent_code: '1110', nature: 'D' },
  { code: '1120', name: 'Cuentas de Ahorro', parent_code: '11', nature: 'D' },
  { code: '112005', name: 'Bancos Comerciales - Ahorros', parent_code: '1120', nature: 'D' },

  // Wompi y Pasarelas a veces se manejan como Cuentas por Cobrar
  { code: '13', name: 'Deudores', parent_code: '1', nature: 'D' },
  { code: '1305', name: 'Clientes', parent_code: '13', nature: 'D' },
  { code: '130505', name: 'Nacionales', parent_code: '1305', nature: 'D' },
  { code: '1345', name: 'Ingresos por Cobrar (Pasarelas)', parent_code: '13', nature: 'D' },
  { code: '134510', name: 'Ventas Wompi por liquidar', parent_code: '1345', nature: 'D' },
  
  // Anticipos de impuestos (Compras)
  { code: '1355', name: 'Anticipo de Impuestos y Contribuciones', parent_code: '13', nature: 'D' },
  { code: '135515', name: 'Retención en la fuente (Anticipo)', parent_code: '1355', nature: 'D' },
  { code: '135517', name: 'Impuesto a las ventas retenido (RETEIVA)', parent_code: '1355', nature: 'D' },
  
  // Inventarios
  { code: '14', name: 'Inventarios', parent_code: '1', nature: 'D' },
  { code: '1435', name: 'Mercancías no fabricadas por la empresa', parent_code: '14', nature: 'D' },
  
  // 2. PASIVOS (Crédito)
  { code: '2', name: 'Pasivo', parent_code: null, nature: 'C' },
  { code: '21', name: 'Obligaciones Financieras', parent_code: '2', nature: 'C' },
  { code: '22', name: 'Proveedores', parent_code: '2', nature: 'C' },
  { code: '2205', name: 'Nacionales', parent_code: '22', nature: 'C' },
  { code: '23', name: 'Cuentas por Pagar', parent_code: '2', nature: 'C' },
  { code: '2365', name: 'Retención en la fuente por pagar', parent_code: '23', nature: 'C' },
  { code: '236540', name: 'Retención por compras', parent_code: '2365', nature: 'C' },

  // Anticipos y avances recibidos de clientes (se cruzan contra factura posterior)
  { code: '28', name: 'Otros Pasivos', parent_code: '2', nature: 'C' },
  { code: '2805', name: 'Anticipos y Avances Recibidos', parent_code: '28', nature: 'C' },
  { code: '280505', name: 'De Clientes', parent_code: '2805', nature: 'C' },
  
  // Impuestos y Gravámenes Reales (IVA)
  { code: '24', name: 'Impuestos, Gravámenes y Tasas', parent_code: '2', nature: 'C' },
  { code: '2408', name: 'Impuesto sobre las Ventas por Pagar (IVA)', parent_code: '24', nature: 'C' },
  { code: '240801', name: 'IVA Generado (Ventas)', parent_code: '2408', nature: 'C' },
  { code: '240802', name: 'IVA Descontable (Compras)', parent_code: '2408', nature: 'D' }, // Técnicamente D pero es en cuenta pasivo
  
  // 3. PATRIMONIO (Crédito)
  { code: '3', name: 'Patrimonio', parent_code: null, nature: 'C' },
  { code: '31', name: 'Capital Social', parent_code: '3', nature: 'C' },
  { code: '3105', name: 'Capital Suscrito y Pagado', parent_code: '31', nature: 'C' },
  { code: '36', name: 'Resultados del Ejercicio', parent_code: '3', nature: 'C' },
  
  // 4. INGRESOS (Crédito)
  { code: '4', name: 'Ingresos', parent_code: null, nature: 'C' },
  { code: '41', name: 'Operacionales', parent_code: '4', nature: 'C' },
  { code: '4135', name: 'Comercio al por mayor y menor', parent_code: '41', nature: 'C' },
  { code: '413524', name: 'Venta de Productos Textiles y Prendas', parent_code: '4135', nature: 'C' },
  
  { code: '4175', name: 'Devoluciones en Ventas', parent_code: '41', nature: 'D' }, 
  
  // 5. GASTOS (Débito)
  { code: '5', name: 'Gastos', parent_code: null, nature: 'D' },
  { code: '51', name: 'Administración', parent_code: '5', nature: 'D' },
  { code: '5195', name: 'Diversos', parent_code: '51', nature: 'D' },
  { code: '519595', name: 'Otros (Comisiones Pasarelas, etc)', parent_code: '5195', nature: 'D' },
  { code: '52', name: 'Ventas (Gastos Operacionales)', parent_code: '5', nature: 'D' },
  { code: '53', name: 'No Operacionales (Gastos Financieros)', parent_code: '5', nature: 'D' },
  { code: '5305', name: 'Financieros', parent_code: '53', nature: 'D' },
  { code: '530515', name: 'Comisiones', parent_code: '5305', nature: 'D' },
  
  // 6. COSTOS (Débito)
  { code: '6', name: 'Costos de Ventas', parent_code: null, nature: 'D' },
  { code: '61', name: 'Costo de Ventas y Prestación de Servicios', parent_code: '6', nature: 'D' },
  { code: '6135', name: 'Comercio al por Mayor y Menor', parent_code: '61', nature: 'D' },
  { code: '613524', name: 'Costo Venta Prendas de Vestir', parent_code: '6135', nature: 'D' },
];

async function main() {
  console.log('Iniciando poblamiento del Maestro PUC Colombiano...');

  for (const account of pucBase) {
    const len = account.code.length;
    let level = 1;
    if (len === 2) level = 2;
    else if (len >= 3 && len <= 4) level = 3;
    else if (len >= 5 && len <= 6) level = 4;
    else if (len > 6) level = 5;

    const acceptsMovements = level >= 4;

    await prisma.pucAccount.upsert({
      where: { code: account.code },
      update: {
        name: account.name,
        nature: account.nature,
        parent_code: account.parent_code,
        level: level,
        accepts_movements: acceptsMovements,
        is_active: true,
      },
      create: {
        code: account.code,
        name: account.name,
        nature: account.nature,
        parent_code: account.parent_code,
        level: level,
        accepts_movements: acceptsMovements,
        is_active: true,
      },
    });
    console.log("✅ Cuenta verificada/creada: " + account.code + " - " + account.name);
  }

  console.log('🎉 Migración del PUC finalizada exitosamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
