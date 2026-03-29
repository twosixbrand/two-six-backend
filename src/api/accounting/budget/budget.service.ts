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
}
