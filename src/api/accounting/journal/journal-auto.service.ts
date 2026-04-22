import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { TaxConfigService } from '../tax-config/tax-config.service';
import { ClosingService } from '../closing/closing.service';

@Injectable()
export class JournalAutoService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private taxConfigService: TaxConfigService,
    private closingService: ClosingService,
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

    if (!account.accepts_movements) {
      throw new Error(`La cuenta PUC ${code} es una cuenta mayor y no acepta movimientos directos.`);
    }

    if (!account.is_active) {
      throw new Error(`La cuenta PUC ${code} se encuentra inactiva.`);
    }

    return account;
  }

  /**
   * Auto-create journal entry for a completed sale:
   * - Debit 111005 (Bancos) = total_payment
   * - Credit 240801 (IVA generado) = iva
   * - Credit 413535 (Ingresos) = total_payment - iva
   * - Auto-calculate ICA and Autoretención if configured
   */
  async onSaleCompleted(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { 
        customer: {
          include: { addresses: { where: { is_default: true } } }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    const entryDate = new Date();
    const isClosed = await this.closingService.isPeriodClosed(entryDate);
    if (isClosed) {
      console.error(`Cierre preventivo: No se puede generar asiento de venta para Orden ${orderId} porque el periodo actual ya está cerrado contablemente.`);
      return null;
    }

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);

      const bancosAccount = await this.findAccountByCode(prisma, '111005');
      const ivaAccount = await this.findAccountByCode(prisma, '240801');
      const ingresosAccount = await this.findAccountByCode(prisma, '413524');

      const totalPayment = order.total_payment;
      const iva = order.iva;
      const ingresos = totalPayment - iva;

      // --- Wompi Commission Calculation ---
      let netToBank = totalPayment;
      let commissionExpense = 0;
      let commissionIva = 0;

      if (order.payment_method?.startsWith('WOMPI')) {
        const feePercentage = 0.0285; // 2.85%
        const fixedFee = 800; // $800 COP
        
        commissionExpense = Number((totalPayment * feePercentage + fixedFee).toFixed(2));
        commissionIva = Number((commissionExpense * 0.19).toFixed(2));
        netToBank = Number((totalPayment - (commissionExpense + commissionIva)).toFixed(2));
      }

      const lines: any[] = [
        {
          id_puc_account: bancosAccount.id,
          description: `Ingreso neto por venta ${order.payment_method?.startsWith('WOMPI') ? '(Neto Wompi)' : ''}`,
          debit: netToBank,
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
      ];

      // Add commission lines if applicable
      if (commissionExpense > 0) {
        const commissionAccount = await this.findAccountByCode(prisma, '530515');
        const ivaDescontableAccount = await this.findAccountByCode(prisma, '240802');

        lines.push({
          id_puc_account: commissionAccount.id,
          description: 'Gasto comisión pasarela Wompi',
          debit: commissionExpense,
          credit: 0,
        });
        lines.push({
          id_puc_account: ivaDescontableAccount.id,
          description: 'IVA descontable sobre comisión',
          debit: commissionIva,
          credit: 0,
        });
      }

      let totalDebit = netToBank + commissionExpense + commissionIva;
      let totalCredit = iva + ingresos;

      // --- Cálculo de Impuestos Adicionales (ICA, Autorretención) ---
      // Determinamos la ciudad para el ICA (usamos la dirección de envío o la del cliente)
      // Nota: En un sistema real, el ICA depende de donde se realiza la actividad económica
      let cityId: number | undefined = undefined;
      if (order.customer?.addresses?.length > 0) {
        const city = await prisma.city.findFirst({
          where: { name: order.customer.addresses[0].city }
        });
        cityId = city?.id;
      }

      const calculatedTaxes: any[] = await this.taxConfigService.calculateTaxes(ingresos, cityId);
      const taxTransactionsData: any[] = [];

      for (const tax of calculatedTaxes) {
        if (tax.config.puc_account_debit && tax.config.puc_account_credit) {
          lines.push({
            id_puc_account: tax.config.puc_account_debit,
            description: `${tax.config.name} (Gasto)`,
            debit: tax.amount,
            credit: 0,
          });
          lines.push({
            id_puc_account: tax.config.puc_account_credit,
            description: `${tax.config.name} (Pasivo/Anticipo)`,
            debit: 0,
            credit: tax.amount,
          });
          totalDebit += tax.amount;
          totalCredit += tax.amount;

          taxTransactionsData.push({
            tax_type: tax.type,
            base_amount: tax.base,
            rate: Number(tax.config.rate),
            tax_amount: tax.amount,
            city_name: tax.config.city?.name || 'GLOBAL',
          });
        }
      }

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
            create: lines,
          },
          taxTransactions: {
            create: taxTransactionsData,
          },
        },
        include: {
          lines: {
            include: {
              pucAccount: true,
            },
          },
          taxTransactions: true,
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

    const entryDate = new Date();
    const isClosed = await this.closingService.isPeriodClosed(entryDate);
    if (isClosed) {
      console.error(`Cierre preventivo: No se puede generar asiento de gasto para ID ${expenseId} porque el periodo actual ya está cerrado contablemente.`);
      return null;
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
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                clothingSize: {
                  include: {
                    clothingColor: {
                      include: { design: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
    });

    if (!order) {
      throw new NotFoundException(`Orden con ID ${orderId} no encontrada`);
    }

    const entryDate = new Date();
    const isClosed = await this.closingService.isPeriodClosed(entryDate);
    if (isClosed) {
      console.error(`Cierre preventivo: No se puede generar asiento de costo para Orden ${orderId} porque el periodo actual ya está cerrado contablemente.`);
      return null;
    }

    // Calculate actual cost amount from designs
    let totalActualCost = 0;
    let itemsWithMissingCost = 0;

    for (const item of order.orderItems) {
      const manufacturedCost = item.product?.clothingSize?.clothingColor?.design?.manufactured_cost;
      if (manufacturedCost && manufacturedCost > 0) {
        totalActualCost += manufacturedCost * item.quantity;
      } else {
        itemsWithMissingCost++;
        // Fallback to estimated cost for this specific item if design cost is missing
        const fallbackPercentage = (this.configService.get<number>('COST_PERCENTAGE') || 60) / 100;
        totalActualCost += (item.unit_price * item.quantity) * fallbackPercentage;
      }
    }

    const costAmount = Number(totalActualCost.toFixed(2));

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

  /**
   * Auto-create journal entry for Inventory Adjustments:
   * - MERMA: Debit 519995 (Otros Gastos - Merma) / Credit 143505 (Inventario)
   * - REGALO: Debit 523560 (Publicidad/Promocion) / Credit 143505 (Inventario)
   * - SOBRANTE: Debit 143505 (Inventario) / Credit 429581 (Otros Ingresos - Sobrantes)
   */
  async onInventoryAdjustment(adjustmentId: number) {
    const adjustment = await this.prisma.inventoryAdjustment.findUnique({
      where: { id: adjustmentId },
      include: { items: true },
    });

    if (!adjustment || adjustment.items.length === 0) return null;

    const entryDate = new Date();
    const isClosed = await this.closingService.isPeriodClosed(entryDate);
    if (isClosed) return null;

    // Calculate total cost
    const totalCost = adjustment.items.reduce((sum, item) => sum + (item.unit_cost * Math.abs(item.quantity)), 0);
    if (totalCost <= 0) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const inventoryAccount = await this.findAccountByCode(prisma, '143505');
      
      let debitAccountCode: string;
      let creditAccountCode: string;
      let isInventoryDebit = adjustment.reason === 'SOBRANTE' || adjustment.reason === 'ERROR_CONTEO';

      if (adjustment.reason === 'REGALO') {
        debitAccountCode = '523560'; // Publicidad
        creditAccountCode = '143505'; // Inventario
      } else if (adjustment.reason === 'MERMA') {
        debitAccountCode = '519995'; // Otros Gastos
        creditAccountCode = '143505'; // Inventario
      } else if (adjustment.reason === 'SOBRANTE') {
        debitAccountCode = '143505'; // Inventario
        creditAccountCode = '429581'; // Otros Ingresos
      } else {
        // Fallback or generic error conteo
        debitAccountCode = isInventoryDebit ? '143505' : '519995';
        creditAccountCode = isInventoryDebit ? '429581' : '143505';
      }

      const dAcc = await this.findAccountByCode(prisma, debitAccountCode);
      const cAcc = await this.findAccountByCode(prisma, creditAccountCode);

      const entry = await prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Ajuste Inventario (${adjustment.reason}) - Ref ${adjustment.id}`,
          source_type: 'INVENTORY_ADJUSTMENT',
          source_id: adjustment.id,
          status: 'POSTED',
          total_debit: Number(totalCost.toFixed(2)),
          total_credit: Number(totalCost.toFixed(2)),
          lines: {
            create: [
              { id_puc_account: dAcc.id, debit: totalCost, credit: 0, description: `Ajuste ${adjustment.reason}` },
              { id_puc_account: cAcc.id, debit: 0, credit: totalCost, description: `Ajuste ${adjustment.reason}` },
            ]
          }
        }
      });

      // Link adjustment to entry
      await prisma.inventoryAdjustment.update({
        where: { id: adjustmentId },
        data: { id_journal_entry: entry.id }
      });

      return entry;
    });
  }

  // ============================================================
  //  MÓDULO CONSIGNACIÓN (F01-F08)
  // ============================================================

  /**
   * Costo unitario de un item, usando manufactured_cost con fallback al % del precio.
   * Misma regla que onCostOfGoodsSold (línea 373-383).
   */
  private costOfItem(manufacturedCost?: number | null, fallbackPrice?: number): number {
    if (manufacturedCost && manufacturedCost > 0) return manufacturedCost;
    const fallbackPercentage = (this.configService.get<number>('COST_PERCENTAGE') || 60) / 100;
    return (fallbackPrice ?? 0) * fallbackPercentage;
  }

  /**
   * F03 - Despacho enviado: reclasifica inventario propio → consignación (al costo).
   * Dr 143510 Mercancía en Consignación en Poder de Terceros
   * Cr 143505 Inventario Mercancía Propia
   */
  async onConsignmentDispatchSent(dispatchId: number) {
    const dispatch = await this.prisma.consignmentDispatch.findUnique({
      where: { id: dispatchId },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                product: true,
                clothingColor: { include: { design: true } },
              },
            },
          },
        },
      },
    });
    if (!dispatch || dispatch.items.length === 0) return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    let totalCost = 0;
    for (const it of dispatch.items) {
      const manufacturedCost = it.clothingSize.clothingColor.design.manufactured_cost;
      const fallbackPrice = it.clothingSize.product?.price;
      totalCost += this.costOfItem(manufacturedCost, fallbackPrice) * it.quantity;
    }
    totalCost = Number(totalCost.toFixed(2));
    if (totalCost <= 0) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const consignmentInv = await this.findAccountByCode(prisma, '143510');
      const ownInv = await this.findAccountByCode(prisma, '143505');

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Despacho consignación ${dispatch.dispatch_number}`,
          source_type: 'CONSIGNMENT_DISPATCH',
          source_id: dispatch.id,
          status: 'POSTED',
          total_debit: totalCost,
          total_credit: totalCost,
          lines: {
            create: [
              {
                id_puc_account: consignmentInv.id,
                description: `Reclass a consignación — ${dispatch.dispatch_number}`,
                debit: totalCost,
                credit: 0,
              },
              {
                id_puc_account: ownInv.id,
                description: `Salida inventario propio — ${dispatch.dispatch_number}`,
                debit: 0,
                credit: totalCost,
              },
            ],
          },
        },
      });
    });
  }

  /**
   * F04 - Devolución portafolio/obsolescencia: inventario vuelve al stock propio de Two Six.
   * Dr 143505 Inventario Mercancía Propia
   * Cr 143510 Mercancía en Consignación en Poder de Terceros
   */
  async onConsignmentReturnPortfolio(returnId: number) {
    const ret = await this.prisma.consignmentReturn.findUnique({
      where: { id: returnId },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                product: true,
                clothingColor: { include: { design: true } },
              },
            },
          },
        },
      },
    });
    if (!ret || ret.return_type !== 'PORTFOLIO' || ret.items.length === 0) return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    let totalCost = 0;
    for (const it of ret.items) {
      const mc = it.clothingSize.clothingColor.design.manufactured_cost;
      totalCost += this.costOfItem(mc, it.clothingSize.product?.price) * it.quantity;
    }
    totalCost = Number(totalCost.toFixed(2));
    if (totalCost <= 0) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const ownInv = await this.findAccountByCode(prisma, '143505');
      const consignmentInv = await this.findAccountByCode(prisma, '143510');

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Devolución portafolio consignación #${ret.id}`,
          source_type: 'CONSIGNMENT_RETURN_PORTFOLIO',
          source_id: ret.id,
          status: 'POSTED',
          total_debit: totalCost,
          total_credit: totalCost,
          lines: {
            create: [
              { id_puc_account: ownInv.id, description: 'Reingreso inventario propio', debit: totalCost, credit: 0 },
              { id_puc_account: consignmentInv.id, description: 'Salida de consignación', debit: 0, credit: totalCost },
            ],
          },
        },
      });
    });
  }

  /**
   * F04 - Devolución por garantía: la prenda defectuosa es baja definitiva del inventario.
   * Dr 519910 Gasto Merma / Deterioro (por garantías)
   * Cr 143510 Mercancía en Consignación en Poder de Terceros
   */
  async onConsignmentReturnWarranty(returnId: number) {
    const ret = await this.prisma.consignmentReturn.findUnique({
      where: { id: returnId },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                product: true,
                clothingColor: { include: { design: true } },
              },
            },
          },
        },
      },
    });
    if (!ret || ret.return_type !== 'WARRANTY' || ret.items.length === 0) return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    let totalCost = 0;
    for (const it of ret.items) {
      const mc = it.clothingSize.clothingColor.design.manufactured_cost;
      totalCost += this.costOfItem(mc, it.clothingSize.product?.price) * it.quantity;
    }
    totalCost = Number(totalCost.toFixed(2));
    if (totalCost <= 0) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const warrantyExpense = await this.findAccountByCode(prisma, '519910');
      const consignmentInv = await this.findAccountByCode(prisma, '143510');

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Garantía consignación #${ret.id}`,
          source_type: 'CONSIGNMENT_RETURN_WARRANTY',
          source_id: ret.id,
          status: 'POSTED',
          total_debit: totalCost,
          total_credit: totalCost,
          lines: {
            create: [
              { id_puc_account: warrantyExpense.id, description: 'Baja por garantía', debit: totalCost, credit: 0 },
              { id_puc_account: consignmentInv.id, description: 'Salida de consignación', debit: 0, credit: totalCost },
            ],
          },
        },
      });
    });
  }

  /**
   * F04/F05 - Devolución post-venta: reverso de ingreso + reingreso de inventario + reverso COGS.
   * Asiento único con 5 líneas:
   *  Dr 413524 Ingresos (reverso de la venta original, al precio facturado)
   *  Dr 240801 IVA generado (reverso)
   *  Cr 130505 Clientes (saldo a favor del cliente — base del nota crédito DIAN)
   *  Dr 143505 Inventario Mercancía Propia (reingreso al costo)
   *  Cr 613524 Costo Venta (reverso del COGS)
   */
  async onConsignmentReturnPostSale(returnId: number) {
    const ret = await this.prisma.consignmentReturn.findUnique({
      where: { id: returnId },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                product: true,
                clothingColor: { include: { design: true } },
              },
            },
          },
        },
        order: true,
      },
    });
    if (!ret || ret.return_type !== 'POST_SALE' || ret.items.length === 0) return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    // Reverso de venta — usa unit_price capturado al crear la devolución
    let salesSubtotal = 0;
    let salesCostTotal = 0;
    for (const it of ret.items) {
      const qty = it.quantity;
      const unitPrice = it.unit_price ?? 0;
      salesSubtotal += unitPrice * qty;

      const mc = it.clothingSize.clothingColor.design.manufactured_cost;
      salesCostTotal += this.costOfItem(mc, unitPrice) * qty;
    }
    salesSubtotal = Number(salesSubtotal.toFixed(2));
    salesCostTotal = Number(salesCostTotal.toFixed(2));
    if (salesSubtotal <= 0) return null;

    const iva = Number((salesSubtotal * 0.19).toFixed(2));
    const total = Number((salesSubtotal + iva).toFixed(2));

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const ingresos = await this.findAccountByCode(prisma, '413524');
      const ivaGenerado = await this.findAccountByCode(prisma, '240801');
      const clientes = await this.findAccountByCode(prisma, '130505');
      const ownInv = await this.findAccountByCode(prisma, '143505');
      const cogs = await this.findAccountByCode(prisma, '613524');

      const totalDebit = Number((salesSubtotal + iva + salesCostTotal).toFixed(2));
      const totalCredit = Number((total + salesCostTotal).toFixed(2));

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Devolución post-venta consignación #${ret.id}${ret.order ? ` - Orden ${ret.order.order_reference}` : ''}`,
          source_type: 'CONSIGNMENT_RETURN_POST_SALE',
          source_id: ret.id,
          status: 'POSTED',
          total_debit: totalDebit,
          total_credit: totalCredit,
          lines: {
            create: [
              { id_puc_account: ingresos.id, description: 'Reverso ingresos por devolución', debit: salesSubtotal, credit: 0 },
              { id_puc_account: ivaGenerado.id, description: 'Reverso IVA generado', debit: iva, credit: 0 },
              { id_puc_account: clientes.id, description: 'Saldo a favor del cliente (nota crédito)', debit: 0, credit: total },
              { id_puc_account: ownInv.id, description: 'Reingreso inventario propio', debit: salesCostTotal, credit: 0 },
              { id_puc_account: cogs.id, description: 'Reverso costo venta', debit: 0, credit: salesCostTotal },
            ],
          },
        },
      });
    });
  }

  /**
   * F08 - Sell-out facturado: venta a crédito al aliado de consignación.
   * Diferencia con onSaleCompleted: debita CxC (130505), no Bancos, y no calcula comisión pasarela.
   *  Dr 130505 Clientes (total con IVA)
   *  Cr 413524 Ingresos
   *  Cr 240801 IVA generado
   *  + impuestos configurables (ICA/Autoretención) como en onSaleCompleted
   */
  async onConsignmentSelloutCompleted(orderId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: { include: { addresses: { where: { is_default: true } } } },
      },
    });
    if (!order) return null;
    if (order.status !== 'SELLOUT') return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const clientes = await this.findAccountByCode(prisma, '130505');
      const ivaGenerado = await this.findAccountByCode(prisma, '240801');
      const ingresos = await this.findAccountByCode(prisma, '413524');

      const totalPayment = order.total_payment;
      const iva = order.iva;
      const subtotal = totalPayment - iva;

      const lines: any[] = [
        { id_puc_account: clientes.id, description: `CxC Sell-out ${order.order_reference}`, debit: totalPayment, credit: 0 },
        { id_puc_account: ingresos.id, description: 'Ingresos venta consignación', debit: 0, credit: subtotal },
        { id_puc_account: ivaGenerado.id, description: 'IVA generado venta consignación', debit: 0, credit: iva },
      ];
      let totalDebit = totalPayment;
      let totalCredit = subtotal + iva;

      // Impuestos adicionales (ICA / Autoretención) — misma lógica que onSaleCompleted
      let cityId: number | undefined = undefined;
      if (order.customer?.addresses?.length > 0) {
        const city = await prisma.city.findFirst({
          where: { name: order.customer.addresses[0].city },
        });
        cityId = city?.id;
      }
      const calculatedTaxes: any[] = await this.taxConfigService.calculateTaxes(subtotal, cityId);
      const taxTransactionsData: any[] = [];
      for (const tax of calculatedTaxes) {
        if (tax.config.puc_account_debit && tax.config.puc_account_credit) {
          lines.push({ id_puc_account: tax.config.puc_account_debit, description: `${tax.config.name} (Gasto)`, debit: tax.amount, credit: 0 });
          lines.push({ id_puc_account: tax.config.puc_account_credit, description: `${tax.config.name} (Pasivo/Anticipo)`, debit: 0, credit: tax.amount });
          totalDebit += tax.amount;
          totalCredit += tax.amount;
          taxTransactionsData.push({
            tax_type: tax.type,
            base_amount: tax.base,
            rate: Number(tax.config.rate),
            tax_amount: tax.amount,
            city_name: tax.config.city?.name || 'GLOBAL',
          });
        }
      }

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Sell-out consignación - Orden ${order.order_reference}`,
          source_type: 'CONSIGNMENT_SELLOUT',
          source_id: order.id,
          status: 'POSTED',
          total_debit: Number(totalDebit.toFixed(2)),
          total_credit: Number(totalCredit.toFixed(2)),
          lines: { create: lines },
          taxTransactions: { create: taxTransactionsData },
        },
        include: { lines: { include: { pucAccount: true } }, taxTransactions: true },
      });
    });
  }

  /**
   * F07 - Merma facturada al cliente: venta a crédito imputada a "Otros Ingresos".
   *  Dr 130505 Clientes (total con IVA)
   *  Cr 429505 Aprovechamientos (otros ingresos)
   *  Cr 240801 IVA generado
   */
  async onConsignmentMermaCompleted(orderId: number) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return null;
    if (order.status !== 'MERMA') return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const clientes = await this.findAccountByCode(prisma, '130505');
      const ivaGenerado = await this.findAccountByCode(prisma, '240801');
      const otrosIngresos = await this.findAccountByCode(prisma, '429505');

      const totalPayment = order.total_payment;
      const iva = order.iva;
      const subtotal = totalPayment - iva;

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Facturación merma - Orden ${order.order_reference}`,
          source_type: 'CONSIGNMENT_MERMA',
          source_id: order.id,
          status: 'POSTED',
          total_debit: Number(totalPayment.toFixed(2)),
          total_credit: Number((subtotal + iva).toFixed(2)),
          lines: {
            create: [
              { id_puc_account: clientes.id, description: `CxC Merma ${order.order_reference}`, debit: totalPayment, credit: 0 },
              { id_puc_account: otrosIngresos.id, description: 'Aprovechamiento por merma facturada', debit: 0, credit: subtotal },
              { id_puc_account: ivaGenerado.id, description: 'IVA generado merma', debit: 0, credit: iva },
            ],
          },
        },
      });
    });
  }

  /**
   * F06 - Faltantes del conteo cíclico: pérdida al costo.
   *  Dr 519910 Gasto Merma / Deterioro
   *  Cr 143510 Mercancía en Consignación
   */
  async onCycleCountShortage(cycleCountId: number) {
    const cc = await this.prisma.inventoryCycleCount.findUnique({
      where: { id: cycleCountId },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                product: true,
                clothingColor: { include: { design: true } },
              },
            },
          },
        },
      },
    });
    if (!cc || cc.status !== 'APPROVED') return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    let totalCost = 0;
    for (const it of cc.items) {
      const diff = (it.real_qty ?? 0) - it.theoretical_qty;
      if (diff >= 0) continue; // solo faltantes
      const shortQty = -diff;
      const mc = it.clothingSize.clothingColor.design.manufactured_cost;
      totalCost += this.costOfItem(mc, it.clothingSize.product?.price) * shortQty;
    }
    totalCost = Number(totalCost.toFixed(2));
    if (totalCost <= 0) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const gastoMerma = await this.findAccountByCode(prisma, '519910');
      const consignmentInv = await this.findAccountByCode(prisma, '143510');

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Faltantes conteo cíclico #${cc.id}`,
          source_type: 'CYCLE_COUNT_SHORTAGE',
          source_id: cc.id,
          status: 'POSTED',
          total_debit: totalCost,
          total_credit: totalCost,
          lines: {
            create: [
              { id_puc_account: gastoMerma.id, description: 'Faltante conteo cíclico', debit: totalCost, credit: 0 },
              { id_puc_account: consignmentInv.id, description: 'Salida inventario consignación', debit: 0, credit: totalCost },
            ],
          },
        },
      });
    });
  }

  /**
   * F06 - Sobrantes del conteo cíclico: ingreso al costo.
   *  Dr 143510 Mercancía en Consignación
   *  Cr 429505 Aprovechamientos
   */
  async onCycleCountSurplus(cycleCountId: number) {
    const cc = await this.prisma.inventoryCycleCount.findUnique({
      where: { id: cycleCountId },
      include: {
        items: {
          include: {
            clothingSize: {
              include: {
                product: true,
                clothingColor: { include: { design: true } },
              },
            },
          },
        },
      },
    });
    if (!cc || cc.status !== 'APPROVED') return null;

    const entryDate = new Date();
    if (await this.closingService.isPeriodClosed(entryDate)) return null;

    let totalCost = 0;
    for (const it of cc.items) {
      const diff = (it.real_qty ?? 0) - it.theoretical_qty;
      if (diff <= 0) continue; // solo sobrantes
      const mc = it.clothingSize.clothingColor.design.manufactured_cost;
      totalCost += this.costOfItem(mc, it.clothingSize.product?.price) * diff;
    }
    totalCost = Number(totalCost.toFixed(2));
    if (totalCost <= 0) return null;

    return this.prisma.$transaction(async (prisma) => {
      const entryNumber = await this.getNextEntryNumber(prisma);
      const consignmentInv = await this.findAccountByCode(prisma, '143510');
      const otrosIngresos = await this.findAccountByCode(prisma, '429505');

      return prisma.journalEntry.create({
        data: {
          entry_number: entryNumber,
          entry_date: entryDate,
          description: `Sobrantes conteo cíclico #${cc.id}`,
          source_type: 'CYCLE_COUNT_SURPLUS',
          source_id: cc.id,
          status: 'POSTED',
          total_debit: totalCost,
          total_credit: totalCost,
          lines: {
            create: [
              { id_puc_account: consignmentInv.id, description: 'Ingreso inventario consignación', debit: totalCost, credit: 0 },
              { id_puc_account: otrosIngresos.id, description: 'Aprovechamiento sobrante conteo', debit: 0, credit: totalCost },
            ],
          },
        },
      });
    });
  }
}
