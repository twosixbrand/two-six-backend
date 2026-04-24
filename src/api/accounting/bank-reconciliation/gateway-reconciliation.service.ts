import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { JournalAutoService } from '../journal/journal-auto.service';

@Injectable()
export class GatewayReconciliationService {
  constructor(
    private prisma: PrismaService,
    private journalAutoService: JournalAutoService,
  ) {}

  /**
   * Procesa un archivo de Wompi (o similar) ya parseado
   * y genera los asientos de conciliación:
   * - Ingreso Neto a Bancos
   * - Gasto por Comisiones (530505)
   * - Gasto por IVA de Comisión (530505-IVA o similar)
   * - Cruce contra la cuenta por cobrar (111005 o 130505)
   */
  async processGatewayTransactions(transactions: any[]) {
    const results: any[] = [];

    for (const tx of transactions) {
      try {
        const result = await this.reconcileSingleTransaction(tx);
        results.push({
          reference: tx.reference,
          status: 'SUCCESS',
          entryId: result.id,
        });
      } catch (error) {
        results.push({
          reference: tx.reference,
          status: 'ERROR',
          message: error.message,
        });
      }
    }

    return results;
  }

  private async reconcileSingleTransaction(tx: {
    reference: string;
    gross_amount: number;
    fee_amount: number;
    tax_on_fee: number;
    net_amount: number;
    transaction_date: Date;
    gateway_id?: string;
  }) {
    // 1. Buscar la orden por referencia
    const order = await this.prisma.order.findUnique({
      where: { order_reference: tx.reference },
    });

    if (!order) {
      throw new NotFoundException(
        `Orden con referencia ${tx.reference} no encontrada en el sistema.`,
      );
    }

    // 2. Crear asiento contable de conciliación
    return this.prisma.$transaction(async (prisma) => {
      // Necesitamos las cuentas PUC estándar para esto
      // Nota: En una fase posterior, estas cuentas se pueden parametrizar en el CMS
      const bancosAccount = await this.findAccountByCode(prisma, '111005');
      const gastoComisionAccount = await this.findAccountByCode(
        prisma,
        '530505',
      );
      const clientesAccount = await this.findAccountByCode(prisma, '130505'); // O la cuenta donde se registró la venta originalmente

      const entryNumber = await this.getNextEntryNumber(prisma);

      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: tx.transaction_date || new Date(),
          description: `Conciliación Wompi - Orden ${tx.reference} (Ref: ${tx.gateway_id || 'N/A'})`,
          source_type: 'RECONCILIATION',
          source_id: order.id,
          total_debit: tx.gross_amount,
          total_credit: tx.gross_amount,
          lines: {
            create: [
              {
                id_puc_account: bancosAccount.id,
                description: 'Ingreso neto recibido de pasarela',
                debit: tx.net_amount,
                credit: 0,
              },
              {
                id_puc_account: gastoComisionAccount.id,
                description: 'Comisión pasarela + IVA comisión',
                debit: tx.fee_amount + tx.tax_on_fee,
                credit: 0,
              },
              {
                id_puc_account: clientesAccount.id, // O la cuenta transitoria de Wompi
                description: 'Cruce cuenta por cobrar cliente',
                debit: 0,
                credit: tx.gross_amount,
              },
            ],
          },
        },
      });

      return entry;
    });
  }

  // Métodos auxiliares copiados de JournalAutoService (Refactorizar después a un BaseService si es necesario)
  private async findAccountByCode(prisma: any, code: string) {
    const account = await prisma.pucAccount.findUnique({ where: { code } });
    if (!account)
      throw new NotFoundException(`Cuenta PUC ${code} no encontrada.`);
    return account;
  }

  private async getNextEntryNumber(prisma: any): Promise<string> {
    const lastEntry = await prisma.journalEntry.findFirst({
      orderBy: { id: 'desc' },
      select: { entry_number: true },
    });
    let nextNumber = 1;
    if (lastEntry?.entry_number) {
      const match = lastEntry.entry_number.match(/AC-(\d+)/);
      if (match) nextNumber = parseInt(match[1], 10) + 1;
    }
    return `AC-${String(nextNumber).padStart(6, '0')}`;
  }
}
