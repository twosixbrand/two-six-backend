import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateBankAccountDto } from './dto/create-bank-account.dto';
import { UploadStatementDto } from './dto/upload-statement.dto';
import { parse } from 'csv-parse/sync';

@Injectable()
export class BankReconciliationService {
  constructor(private prisma: PrismaService) {}

  // ── Bank Accounts ─────────────────────────────────────────────

  async getBankAccounts() {
    return this.prisma.bankAccount.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { statements: true } } },
    });
  }

  async createBankAccount(dto: CreateBankAccountDto) {
    return this.prisma.bankAccount.create({
      data: {
        name: dto.name,
        bank_name: dto.bank_name,
        account_number: dto.account_number,
        account_type: dto.account_type,
        id_puc_account: dto.id_puc_account,
        is_active: dto.is_active ?? true,
      },
    });
  }

  // ── CSV Parsing ───────────────────────────────────────────────

  parseCSV(csvContent: string): Array<{
    date: string;
    description: string;
    reference: string | null;
    debit: number;
    credit: number;
    balance: number | null;
  }> {
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });

    return records.map((row: any) => {
      // Support both English and Spanish column names
      const date = row.date || row.fecha || '';
      const description = row.description || row.descripcion || '';
      const reference = row.reference || row.referencia || null;
      const debit = parseFloat(row.debit || row.debito || '0') || 0;
      const credit = parseFloat(row.credit || row.credito || '0') || 0;
      const balance = row.balance || row.saldo
        ? parseFloat(row.balance || row.saldo) || null
        : null;

      if (!date) {
        throw new BadRequestException('Cada fila del CSV debe tener una fecha válida');
      }

      return { date, description, reference, debit, credit, balance };
    });
  }

  // ── Upload Statement ──────────────────────────────────────────

  async uploadStatement(dto: UploadStatementDto) {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });

    if (!bankAccount) {
      throw new NotFoundException(`Cuenta bancaria con ID ${dto.bankAccountId} no encontrada`);
    }

    const parsedRows = this.parseCSV(dto.csvContent);

    if (parsedRows.length === 0) {
      throw new BadRequestException('El archivo CSV no contiene transacciones');
    }

    // Create statement with transactions in a single transaction
    const statement = await this.prisma.bankStatement.create({
      data: {
        id_bank_account: dto.bankAccountId,
        file_name: dto.fileName,
        period_start: new Date(dto.periodStart),
        period_end: new Date(dto.periodEnd),
        status: 'PENDING',
        transactions: {
          create: parsedRows.map((row) => ({
            transaction_date: new Date(row.date),
            description: row.description,
            reference: row.reference,
            debit: row.debit,
            credit: row.credit,
            balance: row.balance,
            matched: false,
          })),
        },
      },
      include: {
        transactions: true,
        bankAccount: true,
      },
    });

    return statement;
  }

  // ── Statements ────────────────────────────────────────────────

  async getStatements() {
    return this.prisma.bankStatement.findMany({
      include: {
        bankAccount: true,
        _count: { select: { transactions: true } },
      },
      orderBy: { upload_date: 'desc' },
    });
  }

  async getStatementDetail(id: number) {
    const statement = await this.prisma.bankStatement.findUnique({
      where: { id },
      include: {
        bankAccount: true,
        transactions: {
          orderBy: { transaction_date: 'asc' },
        },
      },
    });

    if (!statement) {
      throw new NotFoundException(`Extracto bancario con ID ${id} no encontrado`);
    }

    return statement;
  }

  // ── Auto-Match ────────────────────────────────────────────────

  async autoMatch(statementId: number) {
    const statement = await this.prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { transactions: true },
    });

    if (!statement) {
      throw new NotFoundException(`Extracto bancario con ID ${statementId} no encontrado`);
    }

    const unmatchedTxns = statement.transactions.filter((t) => !t.matched);
    let matchedCount = 0;

    for (const txn of unmatchedTxns) {
      const amount = txn.debit > 0 ? txn.debit : txn.credit;
      const dateMin = new Date(txn.transaction_date);
      dateMin.setDate(dateMin.getDate() - 2);
      const dateMax = new Date(txn.transaction_date);
      dateMax.setDate(dateMax.getDate() + 2);

      // Try to match against Payments (credits = income)
      if (txn.credit > 0) {
        const payment = await this.prisma.payments.findFirst({
          where: {
            amount: { gte: amount - 0.01, lte: amount + 0.01 },
            transaction_date: { gte: dateMin, lte: dateMax },
          },
        });

        if (payment) {
          await this.prisma.bankTransaction.update({
            where: { id: txn.id },
            data: {
              matched: true,
              matched_source_type: 'PAYMENT',
              matched_source_id: payment.id,
            },
          });
          matchedCount++;
          continue;
        }
      }

      // Try to match against Expenses (debits = expenses)
      if (txn.debit > 0) {
        const expense = await this.prisma.expense.findFirst({
          where: {
            total: { gte: amount - 0.01, lte: amount + 0.01 },
            expense_date: { gte: dateMin, lte: dateMax },
          },
        });

        if (expense) {
          await this.prisma.bankTransaction.update({
            where: { id: txn.id },
            data: {
              matched: true,
              matched_source_type: 'EXPENSE',
              matched_source_id: expense.id,
            },
          });
          matchedCount++;
          continue;
        }
      }
    }

    // Update statement status
    const updatedStatement = await this.prisma.bankStatement.findUnique({
      where: { id: statementId },
      include: { transactions: true },
    });

    const totalTxns = updatedStatement?.transactions?.length || 0;
    const totalMatched = updatedStatement?.transactions?.filter((t) => t.matched)?.length || 0;

    let newStatus = 'PENDING';
    if (totalMatched === totalTxns) {
      newStatus = 'RECONCILED';
    } else if (totalMatched > 0) {
      newStatus = 'PARTIAL';
    }

    await this.prisma.bankStatement.update({
      where: { id: statementId },
      data: { status: newStatus },
    });

    return {
      statementId,
      totalTransactions: totalTxns,
      matchedTransactions: totalMatched,
      newlyMatched: matchedCount,
      status: newStatus,
    };
  }

  // ── Manual Match ──────────────────────────────────────────────

  async manualMatch(
    bankTransactionId: number,
    sourceType: string,
    sourceId: number,
  ) {
    const txn = await this.prisma.bankTransaction.findUnique({
      where: { id: bankTransactionId },
    });

    if (!txn) {
      throw new NotFoundException(
        `Transacción bancaria con ID ${bankTransactionId} no encontrada`,
      );
    }

    // Validate source exists
    if (sourceType === 'PAYMENT') {
      const payment = await this.prisma.payments.findUnique({
        where: { id: sourceId },
      });
      if (!payment) {
        throw new NotFoundException(`Pago con ID ${sourceId} no encontrado`);
      }
    } else if (sourceType === 'EXPENSE') {
      const expense = await this.prisma.expense.findUnique({
        where: { id: sourceId },
      });
      if (!expense) {
        throw new NotFoundException(`Gasto con ID ${sourceId} no encontrado`);
      }
    } else {
      throw new BadRequestException(
        `Tipo de fuente inválido: ${sourceType}. Use PAYMENT o EXPENSE`,
      );
    }

    const updated = await this.prisma.bankTransaction.update({
      where: { id: bankTransactionId },
      data: {
        matched: true,
        matched_source_type: sourceType,
        matched_source_id: sourceId,
      },
    });

    // Update statement status
    const statement = await this.prisma.bankStatement.findUnique({
      where: { id: txn.id_bank_statement },
      include: { transactions: true },
    });

    const totalTxns = statement?.transactions?.length || 0;
    const totalMatched = statement?.transactions?.filter((t) => t.matched)?.length || 0;

    let newStatus = 'PENDING';
    if (totalMatched === totalTxns) {
      newStatus = 'RECONCILED';
    } else if (totalMatched > 0) {
      newStatus = 'PARTIAL';
    }

    await this.prisma.bankStatement.update({
      where: { id: txn.id_bank_statement },
      data: { status: newStatus },
    });

    return updated;
  }
}
