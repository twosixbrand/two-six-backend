import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CashFlowService {
  constructor(private prisma: PrismaService) {}

  /**
   * Estado de Flujo de Efectivo — Indirect method
   */
  async getCashFlow(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Helper: get balance of accounts matching a code prefix at a given date
    const getBalanceAtDate = async (
      codePrefix: string,
      date: Date,
    ): Promise<number> => {
      const accounts = await this.prisma.pucAccount.findMany({
        where: { code: { startsWith: codePrefix } },
      });
      if (accounts.length === 0) return 0;

      const accountIds = accounts.map((a) => a.id);
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          id_puc_account: { in: accountIds },
          journalEntry: {
            status: 'POSTED',
            entry_date: { lte: date },
          },
        },
      });

      const nature = accounts[0].nature;
      return lines.reduce((sum, l) => {
        return (
          sum + (nature === 'DEBITO' ? l.debit - l.credit : l.credit - l.debit)
        );
      }, 0);
    };

    // Helper: get change in balance between two dates for a code prefix
    const getBalanceChange = async (codePrefix: string): Promise<number> => {
      const endBal = await getBalanceAtDate(codePrefix, end);
      const startBal = await getBalanceAtDate(
        codePrefix,
        new Date(start.getTime() - 1),
      );
      return endBal - startBal;
    };

    // Helper: get period total for PUC class (income statement items)
    const getPeriodTotal = async (classDigit: string): Promise<number> => {
      const accounts = await this.prisma.pucAccount.findMany({
        where: { code: { startsWith: classDigit } },
      });
      if (accounts.length === 0) return 0;

      const accountIds = accounts.map((a) => a.id);
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          id_puc_account: { in: accountIds },
          journalEntry: {
            status: 'POSTED',
            entry_date: { gte: start, lte: end },
          },
        },
        include: { pucAccount: true },
      });

      return lines.reduce((sum, l) => {
        return (
          sum +
          (l.pucAccount.nature === 'CREDITO'
            ? l.credit - l.debit
            : l.debit - l.credit)
        );
      }, 0);
    };

    // 1. Net Income (Ingresos class 4 - Gastos class 5 - Costos class 6)
    const ingresos = await getPeriodTotal('4');
    const gastos = await getPeriodTotal('5');
    const costos = await getPeriodTotal('6');
    const netIncome = ingresos - gastos - costos;

    // 2. Operating Activities adjustments
    const changeAccountsReceivable = await getBalanceChange('1305');
    const changeInventory = await getBalanceChange('1435');
    const changeAccountsPayable = await getBalanceChange('2205');
    const changeTaxesPayable = await getBalanceChange('2408');

    const operatingActivities = {
      netIncome,
      adjustments: [
        {
          concept: 'Cambio en Cuentas por Cobrar (1305)',
          amount: -changeAccountsReceivable,
        },
        { concept: 'Cambio en Inventarios (1435)', amount: -changeInventory },
        {
          concept: 'Cambio en Cuentas por Pagar (2205)',
          amount: changeAccountsPayable,
        },
        {
          concept: 'Cambio en Impuestos por Pagar (2408)',
          amount: changeTaxesPayable,
        },
      ],
      total:
        netIncome -
        changeAccountsReceivable -
        changeInventory +
        changeAccountsPayable +
        changeTaxesPayable,
    };

    // 3. Investing Activities — changes in fixed assets (15xx)
    const changeFixedAssets = await getBalanceChange('15');

    const investingActivities = {
      items: [
        {
          concept: 'Cambio en Propiedad, Planta y Equipo (15xx)',
          amount: -changeFixedAssets,
        },
      ],
      total: -changeFixedAssets,
    };

    // 4. Financing Activities — changes in loans (21xx) and equity (31xx)
    const changeLoans = await getBalanceChange('21');
    const changeEquity = await getBalanceChange('31');

    const financingActivities = {
      items: [
        {
          concept: 'Cambio en Obligaciones Financieras (21xx)',
          amount: changeLoans,
        },
        { concept: 'Cambio en Capital Social (31xx)', amount: changeEquity },
      ],
      total: changeLoans + changeEquity,
    };

    // 5. Cash balances
    const openingCash1105 = await getBalanceAtDate(
      '1105',
      new Date(start.getTime() - 1),
    );
    const openingCash1110 = await getBalanceAtDate(
      '1110',
      new Date(start.getTime() - 1),
    );
    const openingCash = openingCash1105 + openingCash1110;

    const netChange =
      operatingActivities.total +
      investingActivities.total +
      financingActivities.total;
    const closingCash = openingCash + netChange;

    return {
      period: { startDate, endDate },
      operatingActivities,
      investingActivities,
      financingActivities,
      netChange,
      openingCash,
      closingCash,
    };
  }
}
