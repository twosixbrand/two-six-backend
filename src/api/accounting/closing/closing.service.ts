import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ClosingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates sequential entry_number (AC-000001)
   */
  private async getNextEntryNumber(prisma: any): Promise<string> {
    const lastEntry = await prisma.journalEntry.findFirst({
      orderBy: { id: 'desc' },
      select: { entry_number: true },
    });

    let nextNumber = 1;
    if (lastEntry) {
      const match = lastEntry.entry_number.match(/AC-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `AC-${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * Close a monthly period.
   * 1. Verify no prior closing exists
   * 2. Calculate income (class 4) - expenses (class 5) - costs (class 6)
   * 3. Create closing journal entry that zeroes out temporary accounts
   * 4. Save closing record
   */
  async closePeriod(year: number, month: number, closedBy?: string) {
    // Validate inputs
    if (month < 1 || month > 12) {
      throw new BadRequestException('El mes debe estar entre 1 y 12');
    }

    // Check for existing closing
    const existing = await this.prisma.accountingClosing.findUnique({
      where: {
        year_month_closing_type: { year, month, closing_type: 'MONTHLY' },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `Ya existe un cierre para ${year}-${String(month).padStart(2, '0')}`,
      );
    }

    // Define period boundaries
    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59, 999);

    return this.prisma.$transaction(async (prisma) => {
      // Get all journal entry lines for the period grouped by account
      const lines = await prisma.journalEntryLine.findMany({
        where: {
          journalEntry: {
            entry_date: { gte: periodStart, lte: periodEnd },
            status: 'POSTED',
          },
        },
        include: {
          pucAccount: true,
        },
      });

      // Aggregate balances by account
      const accountBalances: Map<number, { account: any; balance: number }> = new Map();

      for (const line of lines) {
        const accountCode = line.pucAccount.code;
        const classCode = accountCode.charAt(0);

        // Only process temporary accounts: class 4 (income), 5 (expenses), 6 (costs)
        if (!['4', '5', '6'].includes(classCode)) continue;

        const current = accountBalances.get(line.id_puc_account) || {
          account: line.pucAccount,
          balance: 0,
        };

        // Class 4 (income) has credit nature: balance = credit - debit
        // Class 5, 6 (expense/cost) have debit nature: balance = debit - credit
        if (classCode === '4') {
          current.balance += line.credit - line.debit;
        } else {
          current.balance += line.debit - line.credit;
        }

        accountBalances.set(line.id_puc_account, current);
      }

      // Calculate totals
      let totalIncome = 0;
      let totalExpenses = 0;
      let totalCosts = 0;

      const closingLines: any[] = [];

      for (const [accountId, { account, balance }] of accountBalances) {
        if (Math.abs(balance) < 0.01) continue; // Skip zero balances

        const classCode = account.code.charAt(0);

        if (classCode === '4') {
          totalIncome += balance;
          // To zero out income: debit the account
          closingLines.push({
            id_puc_account: accountId,
            description: `Cierre ${year}-${String(month).padStart(2, '0')}: ${account.name}`,
            debit: Number(balance.toFixed(2)),
            credit: 0,
          });
        } else if (classCode === '5') {
          totalExpenses += balance;
          // To zero out expenses: credit the account
          closingLines.push({
            id_puc_account: accountId,
            description: `Cierre ${year}-${String(month).padStart(2, '0')}: ${account.name}`,
            debit: 0,
            credit: Number(balance.toFixed(2)),
          });
        } else if (classCode === '6') {
          totalCosts += balance;
          // To zero out costs: credit the account
          closingLines.push({
            id_puc_account: accountId,
            description: `Cierre ${year}-${String(month).padStart(2, '0')}: ${account.name}`,
            debit: 0,
            credit: Number(balance.toFixed(2)),
          });
        }
      }

      const profitLoss = Number((totalIncome - totalExpenses - totalCosts).toFixed(2));

      // Determine result account
      let resultAccountCode: string;
      if (profitLoss >= 0) {
        resultAccountCode = '360505'; // Utilidad del ejercicio
      } else {
        resultAccountCode = '361005'; // Pérdida del ejercicio
      }

      // Find or create result account
      let resultAccount = await prisma.pucAccount.findUnique({
        where: { code: resultAccountCode },
      });

      if (!resultAccount) {
        // Try to find a close match
        const prefix = resultAccountCode.substring(0, 4);
        resultAccount = await prisma.pucAccount.findFirst({
          where: { code: { startsWith: prefix }, accepts_movements: true, is_active: true },
        });
      }

      if (!resultAccount) {
        throw new NotFoundException(
          `Cuenta PUC ${resultAccountCode} no encontrada. Configure la cuenta de resultado del ejercicio.`,
        );
      }

      // Add the result line
      if (profitLoss >= 0) {
        // Profit: credit 360505
        closingLines.push({
          id_puc_account: resultAccount.id,
          description: `Utilidad del periodo ${year}-${String(month).padStart(2, '0')}`,
          debit: 0,
          credit: Number(profitLoss.toFixed(2)),
        });
      } else {
        // Loss: debit 361005
        closingLines.push({
          id_puc_account: resultAccount.id,
          description: `Pérdida del periodo ${year}-${String(month).padStart(2, '0')}`,
          debit: Number(Math.abs(profitLoss).toFixed(2)),
          credit: 0,
        });
      }

      // Calculate totals for journal entry
      const totalDebit = closingLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = closingLines.reduce((sum, l) => sum + l.credit, 0);

      // Create closing journal entry
      const entryNumber = await this.getNextEntryNumber(prisma);

      let journalEntryId: number | null = null;

      if (closingLines.length > 0) {
        const entry = await prisma.journalEntry.create({
          data: {
            entry_number: entryNumber,
            entry_date: periodEnd,
            description: `Cierre contable mensual ${year}-${String(month).padStart(2, '0')}`,
            source_type: 'CLOSING',
            status: 'POSTED',
            total_debit: Number(totalDebit.toFixed(2)),
            total_credit: Number(totalCredit.toFixed(2)),
            lines: {
              create: closingLines,
            },
          },
        });
        journalEntryId = entry.id;
      }

      // Save closing record
      const closing = await prisma.accountingClosing.create({
        data: {
          year,
          month,
          closing_type: 'MONTHLY',
          journal_entry_id: journalEntryId,
          profit_loss: profitLoss,
          status: 'CLOSED',
          closed_by: closedBy || null,
        },
      });

      return closing;
    });
  }

  /**
   * Annual closing:
   * 1. Close all remaining months
   * 2. Transfer 3605 (Utilidad del ejercicio) to 3705 (Resultados de ejercicios anteriores)
   * 3. Create annual closing journal entry
   */
  async annualClose(year: number, closedBy?: string) {
    // Check for existing annual closing
    const existingAnnual = await this.prisma.accountingClosing.findUnique({
      where: {
        year_month_closing_type: { year, month: 0, closing_type: 'ANNUAL' },
      },
    });

    if (existingAnnual) {
      throw new BadRequestException(`Ya existe un cierre anual para ${year}`);
    }

    // Close any unclosed months
    for (let m = 1; m <= 12; m++) {
      const monthClosing = await this.prisma.accountingClosing.findUnique({
        where: {
          year_month_closing_type: { year, month: m, closing_type: 'MONTHLY' },
        },
      });

      if (!monthClosing) {
        try {
          await this.closePeriod(year, m, closedBy);
        } catch (err) {
          // If period has no movements, skip silently
          if (err instanceof NotFoundException) continue;
          throw err;
        }
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      // Calculate accumulated profit/loss from 3605xx accounts
      const resultLines = await prisma.journalEntryLine.findMany({
        where: {
          journalEntry: {
            entry_date: {
              gte: new Date(year, 0, 1),
              lte: new Date(year, 11, 31, 23, 59, 59, 999),
            },
            status: 'POSTED',
          },
          pucAccount: {
            code: { startsWith: '3605' },
          },
        },
        include: { pucAccount: true },
      });

      // Balance of 3605 (credit nature): credit - debit
      let utilidadBalance = 0;
      const accountsToClose: Map<number, { account: any; balance: number }> = new Map();

      for (const line of resultLines) {
        const current = accountsToClose.get(line.id_puc_account) || {
          account: line.pucAccount,
          balance: 0,
        };
        current.balance += line.credit - line.debit;
        accountsToClose.set(line.id_puc_account, current);
      }

      for (const [, { balance }] of accountsToClose) {
        utilidadBalance += balance;
      }

      const closingLines: any[] = [];

      // Debit 3605xx to zero them out
      for (const [accountId, { account, balance }] of accountsToClose) {
        if (Math.abs(balance) < 0.01) continue;
        closingLines.push({
          id_puc_account: accountId,
          description: `Cierre anual ${year}: ${account.name}`,
          debit: Number(balance.toFixed(2)),
          credit: 0,
        });
      }

      // Credit 3705 (Resultados de ejercicios anteriores)
      let retainedAccount = await prisma.pucAccount.findUnique({
        where: { code: '370505' },
      });

      if (!retainedAccount) {
        retainedAccount = await prisma.pucAccount.findFirst({
          where: { code: { startsWith: '3705' }, accepts_movements: true, is_active: true },
        });
      }

      if (!retainedAccount) {
        throw new NotFoundException(
          'Cuenta PUC 370505 (Resultados de ejercicios anteriores) no encontrada',
        );
      }

      if (Math.abs(utilidadBalance) >= 0.01) {
        closingLines.push({
          id_puc_account: retainedAccount.id,
          description: `Traslado utilidad/pérdida del ejercicio ${year}`,
          debit: utilidadBalance < 0 ? Number(Math.abs(utilidadBalance).toFixed(2)) : 0,
          credit: utilidadBalance >= 0 ? Number(utilidadBalance.toFixed(2)) : 0,
        });
      }

      const totalDebit = closingLines.reduce((sum, l) => sum + l.debit, 0);
      const totalCredit = closingLines.reduce((sum, l) => sum + l.credit, 0);

      let journalEntryId: number | null = null;

      if (closingLines.length > 0) {
        const entryNumber = await this.getNextEntryNumber(prisma);
        const entry = await prisma.journalEntry.create({
          data: {
            entry_number: entryNumber,
            entry_date: new Date(year, 11, 31, 23, 59, 59),
            description: `Cierre contable anual ${year}`,
            source_type: 'ANNUAL_CLOSING',
            status: 'POSTED',
            total_debit: Number(totalDebit.toFixed(2)),
            total_credit: Number(totalCredit.toFixed(2)),
            lines: {
              create: closingLines,
            },
          },
        });
        journalEntryId = entry.id;
      }

      // Save annual closing record (month=0 for annual)
      const closing = await prisma.accountingClosing.create({
        data: {
          year,
          month: 0,
          closing_type: 'ANNUAL',
          journal_entry_id: journalEntryId,
          profit_loss: Number(utilidadBalance.toFixed(2)),
          status: 'CLOSED',
          closed_by: closedBy || null,
        },
      });

      return closing;
    });
  }

  /**
   * List all period closings
   */
  async getClosings() {
    return this.prisma.accountingClosing.findMany({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  /**
   * Checks if a specific date belongs to a closed period.
   */
  async isPeriodClosed(date: Date): Promise<boolean> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    const closing = await this.prisma.accountingClosing.findFirst({
      where: {
        year,
        OR: [
          { month, closing_type: 'MONTHLY' },
          { closing_type: 'ANNUAL' }
        ],
        status: 'CLOSED'
      }
    });

    return !!closing;
  }
}
