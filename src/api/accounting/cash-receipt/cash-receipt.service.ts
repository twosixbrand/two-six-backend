import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JournalService } from '../journal/journal.service';
import { ClosingService } from '../closing/closing.service';
import { CreateCashReceiptDto } from './dto/create-cash-receipt.dto';

@Injectable()
export class CashReceiptService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journalService: JournalService,
    private readonly closingService: ClosingService,
  ) {}

  /**
   * Registra un recibo de caja por una consignación bancaria recibida sin
   * factura previa. Genera un JournalEntry con source_type='CASH_RECEIPT'
   * y entry_date igual a la fecha real de la consignación.
   *
   * Líneas generadas:
   *   DB  <bank_puc_code>      amount   (ej: 112005 Bancos Ahorros)
   *   CR  <advance_puc_code>   amount   (ej: 280505 Anticipos Clientes)
   */
  async createCashReceipt(dto: CreateCashReceiptDto) {
    const consignmentDate = new Date(dto.consignment_date);

    const isClosed = await this.closingService.isPeriodClosed(consignmentDate);
    if (isClosed) {
      throw new ForbiddenException(
        'No se puede registrar el recibo de caja: el período contable de esa fecha está cerrado.',
      );
    }

    const [bankAccount, advanceAccount] = await Promise.all([
      this.prisma.pucAccount.findUnique({ where: { code: dto.bank_puc_code } }),
      this.prisma.pucAccount.findUnique({ where: { code: dto.advance_puc_code } }),
    ]);

    if (!bankAccount) {
      throw new NotFoundException(`Cuenta PUC de banco no encontrada: ${dto.bank_puc_code}`);
    }
    if (!advanceAccount) {
      throw new NotFoundException(`Cuenta PUC de anticipo no encontrada: ${dto.advance_puc_code}`);
    }
    if (!bankAccount.accepts_movements || !advanceAccount.accepts_movements) {
      throw new BadRequestException(
        'Las cuentas usadas deben ser auxiliares (accepts_movements=true).',
      );
    }

    const customerLabel = dto.customer_name || dto.customer_nit || 'cliente sin identificar';
    const description = `Recibo de caja - Consignación ${dto.reference} - ${customerLabel}`;

    const entry = await this.journalService.create({
      entry_date: dto.consignment_date,
      description,
      source_type: 'CASH_RECEIPT',
      created_by: dto.created_by,
      lines: [
        {
          id_puc_account: bankAccount.id,
          description: `Consignación ${dto.reference}`,
          debit: dto.amount,
          credit: 0,
        },
        {
          id_puc_account: advanceAccount.id,
          description: `Anticipo recibido ${customerLabel}`,
          debit: 0,
          credit: dto.amount,
        },
      ],
    });

    return {
      journal_entry_id: entry.id,
      entry_number: entry.entry_number,
      entry_date: entry.entry_date,
      total: entry.total_debit,
      notes: dto.notes ?? null,
      customer_nit: dto.customer_nit ?? null,
      customer_name: dto.customer_name ?? null,
      reference: dto.reference,
      lines: entry.lines,
    };
  }

  /**
   * Lista los recibos de caja (CASH_RECEIPT) que aún tienen saldo pendiente
   * de cruce contra una factura DIAN manual, para la cuenta de anticipo
   * indicada. Útil para "reanudar" un recibo huérfano cuyo wizard se perdió
   * antes de emitir la factura.
   */
  async listPending(advancePucCode: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { source_type: 'CASH_RECEIPT' },
      include: { lines: { include: { pucAccount: true } } },
      orderBy: { entry_date: 'desc' },
    });

    const pending: any[] = [];
    for (const entry of entries) {
      const advanceLine = entry.lines.find((l) => l.pucAccount.code === advancePucCode);
      if (!advanceLine) continue;
      const balance = await this.getAvailableBalance(entry.id, advancePucCode);
      if (balance > 0.01) {
        pending.push({
          journal_entry_id: entry.id,
          entry_number: entry.entry_number,
          entry_date: entry.entry_date,
          description: entry.description,
          original_amount: advanceLine.credit,
          available_balance: balance,
        });
      }
    }
    return pending;
  }

  /**
   * Calcula el saldo pendiente de cruce sobre una cuenta de anticipo para un
   * recibo de caja específico. Se considera el monto original menos lo ya
   * aplicado por facturas DIAN (cashReceiptJournal relation).
   */
  async getAvailableBalance(journalEntryId: number, advancePucCode: string): Promise<number> {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id: journalEntryId },
      include: {
        lines: { include: { pucAccount: true } },
      },
    });
    if (!entry) {
      throw new NotFoundException(`Recibo de caja #${journalEntryId} no existe.`);
    }

    const advanceLine = entry.lines.find((l) => l.pucAccount.code === advancePucCode);
    if (!advanceLine) {
      throw new BadRequestException(
        `El recibo no tiene línea con la cuenta de anticipo ${advancePucCode}.`,
      );
    }

    const original = advanceLine.credit;

    const applied = await this.prisma.dianEInvoicing.findMany({
      where: { cash_receipt_journal_id: journalEntryId },
      select: { id: true, document_number: true },
    });

    if (applied.length === 0) {
      return original;
    }

    const appliedEntries = await this.prisma.journalEntry.findMany({
      where: {
        source_type: 'MANUAL_DIAN_INVOICE',
        source_id: { in: applied.map((a) => a.id) },
      },
      include: {
        lines: { include: { pucAccount: true } },
      },
    });

    const totalApplied = appliedEntries.reduce((sum, je) => {
      const debitOnAdvance = je.lines
        .filter((l) => l.pucAccount.code === advancePucCode)
        .reduce((s, l) => s + l.debit, 0);
      return sum + debitOnAdvance;
    }, 0);

    return original - totalApplied;
  }
}
