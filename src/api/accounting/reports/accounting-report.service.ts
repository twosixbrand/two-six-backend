import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AccountingReportService {
  constructor(private prisma: PrismaService) { }

  /**
   * Balance General — aggregate journal lines by PUC class 1 (Activos), 2 (Pasivos), 3 (Patrimonio)
   */
  async getBalanceSheet(year: number, month: number) {
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of month

    // Get all posted journal entry lines up to the end of the given month
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          entry_date: { lte: endDate },
        },
      },
      include: {
        pucAccount: true,
      },
    });

    // Aggregate by PUC class (first digit of code)
    const classMap: Record<string, { code: string; name: string; total: number; accounts: any[] }> = {
      '1': { code: '1', name: 'Activos', total: 0, accounts: [] },
      '2': { code: '2', name: 'Pasivos', total: 0, accounts: [] },
      '3': { code: '3', name: 'Patrimonio', total: 0, accounts: [] },
    };

    // Group by account
    const accountTotals: Record<number, { account: any; debit: number; credit: number }> = {};

    for (const line of lines) {
      if (!accountTotals[line.id_puc_account]) {
        accountTotals[line.id_puc_account] = {
          account: line.pucAccount,
          debit: 0,
          credit: 0,
        };
      }
      accountTotals[line.id_puc_account].debit += line.debit;
      accountTotals[line.id_puc_account].credit += line.credit;
    }

    for (const [, data] of Object.entries(accountTotals)) {
      const classDigit = data.account.code.charAt(0);
      if (!classMap[classDigit]) continue;

      const balance = data.account.nature === 'DEBITO'
        ? data.debit - data.credit
        : data.credit - data.debit;

      classMap[classDigit].accounts.push({
        code: data.account.code,
        name: data.account.name,
        debit: data.debit,
        credit: data.credit,
        balance,
      });

      classMap[classDigit].total += balance;
    }

    return {
      period: { year, month },
      date: endDate.toISOString().split('T')[0],
      activos: classMap['1'],
      pasivos: classMap['2'],
      patrimonio: classMap['3'],
      balanceCheck: {
        totalActivos: classMap['1'].total,
        totalPasivosPatrimonio: classMap['2'].total + classMap['3'].total,
        balanced: Math.abs(classMap['1'].total - (classMap['2'].total + classMap['3'].total)) < 0.01,
      },
    };
  }

  /**
   * Estado de Resultados (P&G) — aggregate PUC classes 4 (Ingresos), 5 (Gastos), 6 (Costos)
   */
  async getIncomeStatement(startDate: string, endDate: string) {
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          entry_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        pucAccount: true,
      },
    });

    const classMap: Record<string, { code: string; name: string; total: number; accounts: any[] }> = {
      '4': { code: '4', name: 'Ingresos', total: 0, accounts: [] },
      '5': { code: '5', name: 'Gastos', total: 0, accounts: [] },
      '6': { code: '6', name: 'Costos de Ventas', total: 0, accounts: [] },
    };

    const accountTotals: Record<number, { account: any; debit: number; credit: number }> = {};

    for (const line of lines) {
      if (!accountTotals[line.id_puc_account]) {
        accountTotals[line.id_puc_account] = {
          account: line.pucAccount,
          debit: 0,
          credit: 0,
        };
      }
      accountTotals[line.id_puc_account].debit += line.debit;
      accountTotals[line.id_puc_account].credit += line.credit;
    }

    for (const [, data] of Object.entries(accountTotals)) {
      const classDigit = data.account.code.charAt(0);
      if (!classMap[classDigit]) continue;

      const balance = data.account.nature === 'CREDITO'
        ? data.credit - data.debit
        : data.debit - data.credit;

      classMap[classDigit].accounts.push({
        code: data.account.code,
        name: data.account.name,
        debit: data.debit,
        credit: data.credit,
        balance,
      });

      classMap[classDigit].total += balance;
    }

    const ingresos = classMap['4'].total;
    const gastos = classMap['5'].total;
    const costos = classMap['6'].total;

    return {
      period: { startDate, endDate },
      ingresos: classMap['4'],
      gastos: classMap['5'],
      costos: classMap['6'],
      utilidadBruta: ingresos - costos,
      utilidadNeta: ingresos - costos - gastos,
    };
  }

  /**
   * Libro Mayor — per-account transactions with running balance
   */
  async getGeneralLedger(accountCode: string, startDate: string, endDate: string) {
    const account = await this.prisma.pucAccount.findUnique({
      where: { code: accountCode },
    });

    if (!account) {
      return { error: `Cuenta ${accountCode} no encontrada` };
    }

    // Get opening balance (all lines before startDate)
    const openingLines = await this.prisma.journalEntryLine.findMany({
      where: {
        id_puc_account: account.id,
        journalEntry: {
          status: 'POSTED',
          entry_date: { lt: new Date(startDate) },
        },
      },
    });

    let openingBalance = 0;
    for (const line of openingLines) {
      if (account.nature === 'DEBITO') {
        openingBalance += line.debit - line.credit;
      } else {
        openingBalance += line.credit - line.debit;
      }
    }

    // Get period lines
    const periodLines = await this.prisma.journalEntryLine.findMany({
      where: {
        id_puc_account: account.id,
        journalEntry: {
          status: 'POSTED',
          entry_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        journalEntry: true,
      },
      orderBy: {
        journalEntry: { entry_date: 'asc' },
      },
    });

    let runningBalance = openingBalance;
    const movements = periodLines.map((line) => {
      if (account.nature === 'DEBITO') {
        runningBalance += line.debit - line.credit;
      } else {
        runningBalance += line.credit - line.debit;
      }

      return {
        date: line.journalEntry.entry_date,
        entry_number: line.journalEntry.entry_number,
        description: line.description || line.journalEntry.description,
        debit: line.debit,
        credit: line.credit,
        balance: runningBalance,
      };
    });

    return {
      account: {
        code: account.code,
        name: account.name,
        nature: account.nature,
      },
      period: { startDate, endDate },
      openingBalance,
      movements,
      closingBalance: runningBalance,
    };
  }

  /**
   * Auxiliar — detailed sub-account view
   */
  async getSubsidiaryLedger(accountCode: string, startDate: string, endDate: string) {
    // Find all accounts that start with the given code (the account and all sub-accounts)
    const accounts = await this.prisma.pucAccount.findMany({
      where: {
        code: { startsWith: accountCode },
      },
      orderBy: { code: 'asc' },
    });

    if (accounts.length === 0) {
      return { error: `No se encontraron cuentas con código ${accountCode}` };
    }

    const accountIds = accounts.map((a) => a.id);

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        id_puc_account: { in: accountIds },
        journalEntry: {
          status: 'POSTED',
          entry_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      },
      include: {
        journalEntry: true,
        pucAccount: true,
      },
      orderBy: {
        journalEntry: { entry_date: 'asc' },
      },
    });

    // Group by sub-account
    const grouped: Record<string, any> = {};

    for (const line of lines) {
      const code = line.pucAccount.code;
      if (!grouped[code]) {
        grouped[code] = {
          code: line.pucAccount.code,
          name: line.pucAccount.name,
          nature: line.pucAccount.nature,
          movements: [],
          totalDebit: 0,
          totalCredit: 0,
        };
      }

      grouped[code].movements.push({
        date: line.journalEntry.entry_date,
        entry_number: line.journalEntry.entry_number,
        description: line.description || line.journalEntry.description,
        debit: line.debit,
        credit: line.credit,
      });

      grouped[code].totalDebit += line.debit;
      grouped[code].totalCredit += line.credit;
    }

    // Calculate balances
    const subAccounts = Object.values(grouped).map((acc: any) => ({
      ...acc,
      balance: acc.nature === 'DEBITO'
        ? acc.totalDebit - acc.totalCredit
        : acc.totalCredit - acc.totalDebit,
    }));

    return {
      accountCode,
      period: { startDate, endDate },
      subAccounts,
    };
  }
}
