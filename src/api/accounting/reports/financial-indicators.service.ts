import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FinancialIndicatorsService {
  constructor(private prisma: PrismaService) {}

  async getIndicators(year: number, month: number) {
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all posted journal entry lines up to the end of the given month
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          entry_date: { lte: endDate },
        },
      },
      include: { pucAccount: true },
    });

    // Aggregate balances by PUC code prefix
    const balanceByPrefix: Record<string, number> = {};

    for (const line of lines) {
      const code = line.pucAccount.code;
      // Build balance for various prefix lengths (1, 2, 4 digits)
      for (const len of [1, 2, 4]) {
        const prefix = code.substring(0, len);
        if (!balanceByPrefix[prefix]) balanceByPrefix[prefix] = 0;
        const amount =
          line.pucAccount.nature === 'DEBITO'
            ? line.debit - line.credit
            : line.credit - line.debit;
        balanceByPrefix[prefix] += amount;
      }
    }

    const getBalance = (prefixes: string[]) =>
      prefixes.reduce((sum, p) => sum + (balanceByPrefix[p] || 0), 0);

    // Current assets: 11xx (cash) + 13xx (receivables) + 14xx (inventories)
    const activosCorrientes = getBalance(['11', '13', '14']);
    // Current liabilities: 21xx + 22xx + 23xx + 24xx
    const pasivosCorrientes = getBalance(['21', '22', '23', '24']);
    // Inventories: 14xx
    const inventarios = getBalance(['14']);
    // Total assets: 1xxx
    const totalActivos = getBalance(['1']);
    // Total liabilities: 2xxx
    const totalPasivos = getBalance(['2']);
    // Equity: 3xxx
    const patrimonio = getBalance(['3']);
    // Revenue: 4xxx
    const ingresos = getBalance(['4']);
    // Expenses: 5xxx
    const gastos = getBalance(['5']);
    // Cost of goods sold: 6xxx
    const costos = getBalance(['6']);
    // Net income
    const utilidadNeta = ingresos - costos - gastos;

    // Calculate indicators
    const razonCorriente =
      pasivosCorrientes !== 0
        ? Math.round((activosCorrientes / pasivosCorrientes) * 100) / 100
        : 0;

    const pruebaAcida =
      pasivosCorrientes !== 0
        ? Math.round(
            ((activosCorrientes - inventarios) / pasivosCorrientes) * 100,
          ) / 100
        : 0;

    const capitalDeTrabajo =
      Math.round((activosCorrientes - pasivosCorrientes) * 100) / 100;

    const endeudamiento =
      totalActivos !== 0
        ? Math.round((totalPasivos / totalActivos) * 10000) / 100
        : 0;

    const roe =
      patrimonio !== 0
        ? Math.round((utilidadNeta / patrimonio) * 10000) / 100
        : 0;

    const roa =
      totalActivos !== 0
        ? Math.round((utilidadNeta / totalActivos) * 10000) / 100
        : 0;

    const margenBruto =
      ingresos !== 0
        ? Math.round(((ingresos - costos) / ingresos) * 10000) / 100
        : 0;

    const margenNeto =
      ingresos !== 0 ? Math.round((utilidadNeta / ingresos) * 10000) / 100 : 0;

    const rotacionInventarios =
      inventarios !== 0 ? Math.round((costos / inventarios) * 100) / 100 : 0;

    const diasInventario =
      rotacionInventarios !== 0
        ? Math.round((365 / rotacionInventarios) * 100) / 100
        : 0;

    return {
      period: { year, month },
      indicators: [
        {
          key: 'razon_corriente',
          name: 'Razon Corriente',
          value: razonCorriente,
          unit: 'veces',
          category: 'LIQUIDITY',
          interpretation:
            razonCorriente >= 1.5
              ? 'Buena capacidad de pago a corto plazo'
              : razonCorriente >= 1
                ? 'Capacidad de pago ajustada'
                : 'Riesgo de liquidez',
          status:
            razonCorriente >= 1.5
              ? 'green'
              : razonCorriente >= 1
                ? 'yellow'
                : 'red',
        },
        {
          key: 'prueba_acida',
          name: 'Prueba Acida',
          value: pruebaAcida,
          unit: 'veces',
          category: 'LIQUIDITY',
          interpretation:
            pruebaAcida >= 1
              ? 'Buena liquidez sin depender de inventarios'
              : pruebaAcida >= 0.7
                ? 'Liquidez moderada'
                : 'Dependencia alta de inventarios',
          status:
            pruebaAcida >= 1 ? 'green' : pruebaAcida >= 0.7 ? 'yellow' : 'red',
        },
        {
          key: 'capital_trabajo',
          name: 'Capital de Trabajo',
          value: capitalDeTrabajo,
          unit: 'COP',
          category: 'LIQUIDITY',
          interpretation:
            capitalDeTrabajo > 0
              ? 'Capital de trabajo positivo'
              : 'Capital de trabajo negativo - riesgo financiero',
          status: capitalDeTrabajo > 0 ? 'green' : 'red',
        },
        {
          key: 'endeudamiento',
          name: 'Endeudamiento',
          value: endeudamiento,
          unit: '%',
          category: 'SOLVENCY',
          interpretation:
            endeudamiento <= 50
              ? 'Nivel de endeudamiento saludable'
              : endeudamiento <= 70
                ? 'Endeudamiento moderado'
                : 'Alto endeudamiento',
          status:
            endeudamiento <= 50
              ? 'green'
              : endeudamiento <= 70
                ? 'yellow'
                : 'red',
        },
        {
          key: 'roe',
          name: 'ROE (Rentabilidad Patrimonio)',
          value: roe,
          unit: '%',
          category: 'PROFITABILITY',
          interpretation:
            roe >= 15
              ? 'Excelente rentabilidad sobre patrimonio'
              : roe >= 5
                ? 'Rentabilidad moderada'
                : 'Baja rentabilidad sobre patrimonio',
          status: roe >= 15 ? 'green' : roe >= 5 ? 'yellow' : 'red',
        },
        {
          key: 'roa',
          name: 'ROA (Rentabilidad Activos)',
          value: roa,
          unit: '%',
          category: 'PROFITABILITY',
          interpretation:
            roa >= 10
              ? 'Excelente uso de activos'
              : roa >= 3
                ? 'Uso moderado de activos'
                : 'Bajo retorno sobre activos',
          status: roa >= 10 ? 'green' : roa >= 3 ? 'yellow' : 'red',
        },
        {
          key: 'margen_bruto',
          name: 'Margen Bruto',
          value: margenBruto,
          unit: '%',
          category: 'PROFITABILITY',
          interpretation:
            margenBruto >= 40
              ? 'Margen bruto saludable'
              : margenBruto >= 20
                ? 'Margen bruto moderado'
                : 'Margen bruto bajo',
          status:
            margenBruto >= 40 ? 'green' : margenBruto >= 20 ? 'yellow' : 'red',
        },
        {
          key: 'margen_neto',
          name: 'Margen Neto',
          value: margenNeto,
          unit: '%',
          category: 'PROFITABILITY',
          interpretation:
            margenNeto >= 15
              ? 'Excelente margen neto'
              : margenNeto >= 5
                ? 'Margen neto aceptable'
                : 'Margen neto bajo',
          status:
            margenNeto >= 15 ? 'green' : margenNeto >= 5 ? 'yellow' : 'red',
        },
        {
          key: 'rotacion_inventarios',
          name: 'Rotacion de Inventarios',
          value: rotacionInventarios,
          unit: 'veces',
          category: 'EFFICIENCY',
          interpretation:
            rotacionInventarios >= 6
              ? 'Alta rotacion de inventarios'
              : rotacionInventarios >= 3
                ? 'Rotacion moderada'
                : 'Baja rotacion de inventarios',
          status:
            rotacionInventarios >= 6
              ? 'green'
              : rotacionInventarios >= 3
                ? 'yellow'
                : 'red',
        },
        {
          key: 'dias_inventario',
          name: 'Dias de Inventario',
          value: diasInventario,
          unit: 'dias',
          category: 'EFFICIENCY',
          interpretation:
            diasInventario <= 60
              ? 'Inventario rota rapidamente'
              : diasInventario <= 120
                ? 'Dias de inventario moderados'
                : 'Inventario se mueve lentamente',
          status:
            diasInventario <= 60
              ? 'green'
              : diasInventario <= 120
                ? 'yellow'
                : 'red',
        },
      ],
      rawData: {
        activosCorrientes,
        pasivosCorrientes,
        inventarios,
        totalActivos,
        totalPasivos,
        patrimonio,
        ingresos,
        gastos,
        costos,
        utilidadNeta,
      },
    };
  }
}
