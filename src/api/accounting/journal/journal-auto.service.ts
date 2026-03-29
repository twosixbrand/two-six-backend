import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JournalAutoService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) { }

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
   * Finds a PUC account by code, throws if not found
   */
  private async findAccountByCode(prisma: any, code: string) {
    const account = await prisma.pucAccount.findUnique({
      where: { code },
    });

    if (!account) {
      throw new NotFoundException(`Cuenta PUC ${code} no encontrada. Asegúrese de que el PUC esté configurado.`);
    }

    return account;
  }

  /**
   * Auto-create journal entry for a completed sale:
   * - Debit 111005 (Bancos) = total_payment
   * - Credit 240801 (IVA generado) = iva
   * - Credit 413535 (Ingresos) = total_payment - iva
   */
  async onSaleCompleted(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);

      const bancosAccount = await this.findAccountByCode(prisma, '111005');
      const ivaAccount = await this.findAccountByCode(prisma, '240801');
      const ingresosAccount = await this.findAccountByCode(prisma, '413535');

      const totalPayment = order.total_payment;
      const iva = order.iva;
      const ingresos = totalPayment - iva;

      const totalDebit = totalPayment;
      const totalCredit = iva + ingresos;

      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          description: `Venta - Orden ${order.order_reference || order.id}`,
          source_type: 'SALE',
          source_id: order.id,
          status: 'POSTED',
          total_debit: totalDebit,
          total_credit: totalCredit,
          lines: {
            create: [
              {
                id_puc_account: bancosAccount.id,
                description: 'Ingreso por venta',
                debit: totalPayment,
                credit: 0,
              },
              {
                id_puc_account: ivaAccount.id,
                description: 'IVA generado por venta',
                debit: 0,
                credit: iva,
              },
              {
                id_puc_account: ingresosAccount.id,
                description: 'Ingresos por venta',
                debit: 0,
                credit: ingresos,
              },
            ],
          },
        },
        include: {
          lines: {
            include: {
              pucAccount: true,
            },
          },
        },
      });

      return entry;
    });
  }

  /**
   * Auto-create journal entry for an expense:
   * - Debit expense.puc_account = subtotal
   * - Debit 240802 (IVA descontable) = tax_amount (if > 0)
   * - Credit 236525 (ReteFuente) = retention_amount (if > 0)
   * - Credit 220505 (Proveedores) = total - retention
   */
  async onExpenseCreated(expenseId: number) {
    const expense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
      include: { pucAccount: true },
    });

    if (!expense) {
      throw new NotFoundException(`Gasto con ID ${expenseId} no encontrado`);
    }

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);

      const lines: any[] = [];
      let totalDebit = 0;
      let totalCredit = 0;

      // Debit expense account = subtotal
      lines.push({
        id_puc_account: expense.id_puc_account,
        description: `Gasto: ${expense.description}`,
        debit: expense.subtotal,
        credit: 0,
      });
      totalDebit += expense.subtotal;

      // Debit IVA descontable if tax_amount > 0
      if (expense.tax_amount > 0) {
        const ivaDescontable = await this.findAccountByCode(prisma, '240802');
        lines.push({
          id_puc_account: ivaDescontable.id,
          description: 'IVA descontable',
          debit: expense.tax_amount,
          credit: 0,
        });
        totalDebit += expense.tax_amount;
      }

      // Credit ReteFuente if retention_amount > 0
      if (expense.retention_amount > 0) {
        const reteFuente = await this.findAccountByCode(prisma, '236525');
        lines.push({
          id_puc_account: reteFuente.id,
          description: 'Retención en la fuente',
          debit: 0,
          credit: expense.retention_amount,
        });
        totalCredit += expense.retention_amount;
      }

      // Credit Proveedores = total - retention
      const proveedores = await this.findAccountByCode(prisma, '220505');
      const proveedorCredit = expense.total - expense.retention_amount;
      lines.push({
        id_puc_account: proveedores.id,
        description: `Cuenta por pagar - ${expense.description}`,
        debit: 0,
        credit: proveedorCredit,
      });
      totalCredit += proveedorCredit;

      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          description: `Gasto ${expense.expense_number} - ${expense.description}`,
          source_type: 'EXPENSE',
          source_id: expense.id,
          status: 'POSTED',
          total_debit: totalDebit,
          total_credit: totalCredit,
          lines: {
            create: lines,
          },
        },
        include: {
          lines: {
            include: {
              pucAccount: true,
            },
          },
        },
      });

      return entry;
    });
  }

  /**
   * Auto-create journal entry for Cost of Goods Sold when a sale is completed:
   * - Debit 613535 (Costo de mercancía vendida) = cost amount
   * - Credit 143505 (Inventario de mercancía) = cost amount
   *
   * Cost is calculated as sale price * COST_PERCENTAGE (default 60%).
   */
  async onCostOfGoodsSold(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    // Calculate cost amount: sum of (unit_price * quantity) * costPercentage
    const costPercentage = (this.configService.get<number>('COST_PERCENTAGE') || 60) / 100;
    const salesTotal = order.orderItems.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0,
    );
    const costAmount = Number((salesTotal * costPercentage).toFixed(2));

    if (costAmount <= 0) {
      return null; // No COGS entry needed
    }

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);

      // Find COGS account (613535) or closest 6135xx
      let cogsAccount = await prisma.pucAccount.findUnique({ where: { code: '613535' } });
      if (!cogsAccount) {
        cogsAccount = await prisma.pucAccount.findFirst({
          where: { code: { startsWith: '6135' }, accepts_movements: true, is_active: true },
        });
      }
      if (!cogsAccount) {
        throw new NotFoundException('Cuenta PUC 613535 (Costo de mercancía vendida) no encontrada');
      }

      // Find Inventory account (143505) or closest 1435xx
      let inventoryAccount = await prisma.pucAccount.findUnique({ where: { code: '143505' } });
      if (!inventoryAccount) {
        inventoryAccount = await prisma.pucAccount.findFirst({
          where: { code: { startsWith: '1435' }, accepts_movements: true, is_active: true },
        });
      }
      if (!inventoryAccount) {
        throw new NotFoundException('Cuenta PUC 143505 (Inventario de mercancía) no encontrada');
      }

      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: new Date(),
          description: `Costo de mercancía vendida - Orden ${order.order_reference || order.id}`,
          source_type: 'COGS',
          source_id: order.id,
          status: 'POSTED',
          total_debit: costAmount,
          total_credit: costAmount,
          lines: {
            create: [
              {
                id_puc_account: cogsAccount.id,
                description: 'Costo de mercancía vendida',
                debit: costAmount,
                credit: 0,
              },
              {
                id_puc_account: inventoryAccount.id,
                description: 'Salida de inventario por venta',
                debit: 0,
                credit: costAmount,
              },
            ],
          },
        },
        include: {
          lines: {
            include: {
              pucAccount: true,
            },
          },
        },
      });

      return entry;
    });
  }
}
