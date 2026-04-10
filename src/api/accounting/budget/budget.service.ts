import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class BudgetService {
  constructor(private prisma: PrismaService) { }

  async findAll(year: number) {
    return this.prisma.budget.findMany({
      where: { year },
      include: { pucAccount: true },
      orderBy: [{ pucAccount: { code: 'asc' } }, { month: 'asc' }],
    });
  }

  async upsert(year: number, month: number, idPucAccount: number, amount: number, notes?: string) {
    return this.prisma.budget.upsert({
      where: {
        year_month_id_puc_account: { year, month, id_puc_account: idPucAccount },
      },
      update: {
        budgeted_amount: amount,
        notes: notes ?? undefined,
      },
      create: {
        year,
        month,
        id_puc_account: idPucAccount,
        budgeted_amount: amount,
        notes,
      },
      include: { pucAccount: true },
    });
  }

  async getComparison(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all budgets for year/month
    const budgets = await this.prisma.budget.findMany({
      where: { year, month },
      include: { pucAccount: true },
    });

    // Get actual amounts from journal entries for the same period
    const journalLines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          entry_date: { gte: startDate, lte: endDate },
        },
      },
      include: { pucAccount: true },
    });

    // Aggregate actual amounts by account
    const actualByAccount: Record<number, { debit: number; credit: number; nature: string }> = {};
    for (const line of journalLines) {
      if (!actualByAccount[line.id_puc_account]) {
        actualByAccount[line.id_puc_account] = { debit: 0, credit: 0, nature: line.pucAccount.nature };
      }
      actualByAccount[line.id_puc_account].debit += line.debit;
      actualByAccount[line.id_puc_account].credit += line.credit;
    }

    const comparison = budgets.map((b) => {
      const actual = actualByAccount[b.id_puc_account];
      let executedAmount = 0;
      if (actual) {
        executedAmount = actual.nature === 'DEBITO'
          ? actual.debit - actual.credit
          : actual.credit - actual.debit;
      }

      const variance = executedAmount - b.budgeted_amount;
      const variancePercentage = b.budgeted_amount !== 0
        ? (variance / b.budgeted_amount) * 100
        : 0;

      return {
        id_puc_account: b.id_puc_account,
        code: b.pucAccount.code,
        name: b.pucAccount.name,
        budgeted: b.budgeted_amount,
        executed: executedAmount,
        variance,
        variancePercentage: Math.round(variancePercentage * 100) / 100,
        status: variance > 0 ? 'OVER' : variance < 0 ? 'UNDER' : 'ON_TARGET',
      };
    });

    return {
      period: { year, month },
      items: comparison,
      totals: {
        budgeted: comparison.reduce((s, c) => s + c.budgeted, 0),
        executed: comparison.reduce((s, c) => s + c.executed, 0),
        variance: comparison.reduce((s, c) => s + c.variance, 0),
      },
    };
  }

  async getAnnualComparison(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get all budgets for the year
    const budgets = await this.prisma.budget.findMany({
      where: { year },
      include: { pucAccount: true },
    });

    // Get all journal entries (posted) for the year
    const journalLines = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: {
          status: 'POSTED',
          entry_date: { gte: startDate, lte: endDate },
        },
      },
      include: {
        pucAccount: true,
        journalEntry: true,
      },
    });

    // Map budgets by account and month
    const budgetMap: Record<number, Record<number, number>> = {};
    const accountInfo: Record<number, { code: string; name: string; nature: string }> = {};

    for (const b of budgets) {
      if (!budgetMap[b.id_puc_account]) {
        budgetMap[b.id_puc_account] = {};
        accountInfo[b.id_puc_account] = {
          code: b.pucAccount.code,
          name: b.pucAccount.name,
          nature: b.pucAccount.nature,
        };
      }
      budgetMap[b.id_puc_account][b.month] = b.budgeted_amount;
    }

    // Aggregate execution by account and month
    const executionMap: Record<number, Record<number, { debit: number; credit: number }>> = {};
    for (const line of journalLines) {
      const month = new Date(line.journalEntry.entry_date).getMonth() + 1;
      if (!executionMap[line.id_puc_account]) {
        executionMap[line.id_puc_account] = {};
      }
      if (!executionMap[line.id_puc_account][month]) {
        executionMap[line.id_puc_account][month] = { debit: 0, credit: 0 };
      }
      executionMap[line.id_puc_account][month].debit += line.debit;
      executionMap[line.id_puc_account][month].credit += line.credit;

      // Ensure account info is available even if no budget exists
      if (!accountInfo[line.id_puc_account]) {
        accountInfo[line.id_puc_account] = {
          code: line.pucAccount.code,
          name: line.pucAccount.name,
          nature: line.pucAccount.nature,
        };
      }
    }

    const accountIds = Array.from(new Set([...Object.keys(budgetMap), ...Object.keys(executionMap)])).map(Number);

    const items = accountIds.map((id) => {
      const info = accountInfo[id];
      const months: { month: number; budgeted: number; executed: number; variance: number }[] = [];
      let annualBudgeted = 0;
      let annualExecuted = 0;

      for (let m = 1; m <= 12; m++) {
        const budgeted = budgetMap[id]?.[m] || 0;
        const actual = executionMap[id]?.[m];
        let executed = 0;
        if (actual) {
          executed = info.nature === 'DEBITO'
            ? actual.debit - actual.credit
            : actual.credit - actual.debit;
        }

        const variance = executed - budgeted;
        months.push({
          month: m,
          budgeted,
          executed,
          variance,
        });

        annualBudgeted += budgeted;
        annualExecuted += executed;
      }

      return {
        id_puc_account: id,
        code: info.code,
        name: info.name,
        months,
        totals: {
          budgeted: annualBudgeted,
          executed: annualExecuted,
          variance: annualExecuted - annualBudgeted,
          variancePercentage: annualBudgeted !== 0
            ? Math.round(((annualExecuted - annualBudgeted) / annualBudgeted) * 10000) / 100
            : 0,
        },
      };
    }).sort((a, b) => a.code.localeCompare(b.code));

    return {
      year,
      items,
      grandTotals: {
        budgeted: items.reduce((s, i) => s + i.totals.budgeted, 0),
        executed: items.reduce((s, i) => s + i.totals.executed, 0),
        variance: items.reduce((s, i) => s + i.totals.variance, 0),
      },
    };
  }
}
