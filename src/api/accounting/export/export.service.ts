import { Injectable } from '@nestjs/common';
import { AccountingReportService } from '../reports/accounting-report.service';
import { ExpenseService } from '../expense/expense.service';
import { PayrollService } from '../payroll/payroll.service';
import { JournalService } from '../journal/journal.service';
import { AgingService } from '../reports/aging.service';
import { BudgetService } from '../budget/budget.service';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportService {
  constructor(
    private readonly reportService: AccountingReportService,
    private readonly expenseService: ExpenseService,
    private readonly payrollService: PayrollService,
    private readonly journalService: JournalService,
    private readonly agingService: AgingService,
    private readonly budgetService: BudgetService,
    private readonly prisma: PrismaService,
  ) {}

  private companyHeader(reportName: string, period: string): string[][] {
    return [
      ['TWO SIX S.A.S.'],
      ['NIT: 901.XXX.XXX-X'],
      [reportName],
      [`Periodo: ${period}`],
      [],
    ];
  }

  async generateBalanceSheet(year: number, month: number): Promise<Buffer> {
    const data = await this.reportService.getBalanceSheet(year, month);

    const months = [
      'Enero',
      'Febrero',
      'Marzo',
      'Abril',
      'Mayo',
      'Junio',
      'Julio',
      'Agosto',
      'Septiembre',
      'Octubre',
      'Noviembre',
      'Diciembre',
    ];

    const rows: any[][] = [
      ...this.companyHeader('Balance General', `${months[month - 1]} ${year}`),
      ['Código', 'Cuenta', 'Débito', 'Crédito', 'Saldo'],
    ];

    const addSection = (title: string, section: any) => {
      rows.push([]);
      rows.push([title]);
      if (section?.accounts) {
        for (const acc of section.accounts) {
          rows.push([acc.code, acc.name, acc.debit, acc.credit, acc.balance]);
        }
      }
      rows.push(['', `Total ${title}`, '', '', section?.total || 0]);
    };

    addSection('ACTIVOS', data.activos);
    addSection('PASIVOS', data.pasivos);
    addSection('PATRIMONIO', data.patrimonio);

    rows.push([]);
    rows.push([
      '',
      'Total Activos',
      '',
      '',
      data.balanceCheck?.totalActivos || 0,
    ]);
    rows.push([
      '',
      'Total Pasivos + Patrimonio',
      '',
      '',
      data.balanceCheck?.totalPasivosPatrimonio || 0,
    ]);
    rows.push([
      '',
      'Cuadrado',
      '',
      '',
      data.balanceCheck?.balanced ? 'SI' : 'NO',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 12 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance General');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateIncomeStatement(
    startDate: string,
    endDate: string,
  ): Promise<Buffer> {
    const data = await this.reportService.getIncomeStatement(
      startDate,
      endDate,
    );

    const rows: any[][] = [
      ...this.companyHeader(
        'Estado de Resultados',
        `${startDate} a ${endDate}`,
      ),
      ['Código', 'Cuenta', 'Valor'],
    ];

    const addSection = (title: string, section: any) => {
      rows.push([]);
      rows.push([title]);
      if (section?.accounts) {
        for (const acc of section.accounts) {
          rows.push([acc.code, acc.name, acc.balance]);
        }
      }
      rows.push(['', `Total ${title}`, section?.total || 0]);
    };

    addSection('INGRESOS', data.ingresos);
    addSection('GASTOS', data.gastos);
    addSection('COSTOS DE VENTAS', data.costos);

    rows.push([]);
    rows.push(['', 'Utilidad Bruta', data.utilidadBruta]);
    rows.push(['', 'Utilidad Neta', data.utilidadNeta]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 20 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateGeneralLedger(
    account: string,
    startDate: string,
    endDate: string,
  ): Promise<Buffer> {
    const data = await this.reportService.getGeneralLedger(
      account,
      startDate,
      endDate,
    );

    const accountInfo = (data as any).account || {};
    const rows: any[][] = [
      ...this.companyHeader('Libro Mayor', `${startDate} a ${endDate}`),
      [`Cuenta: ${accountInfo.code || account} - ${accountInfo.name || ''}`],
      [`Naturaleza: ${accountInfo.nature || ''}`],
      [`Saldo Inicial: ${(data as any).openingBalance || 0}`],
      [],
      ['Fecha', 'Nro Asiento', 'Descripción', 'Débito', 'Crédito', 'Saldo'],
    ];

    const movements = (data as any).movements || [];
    for (const mov of movements) {
      rows.push([
        mov.date ? new Date(mov.date).toLocaleDateString('es-CO') : '',
        mov.entry_number || '',
        mov.description || '',
        mov.debit || 0,
        mov.credit || 0,
        mov.balance || 0,
      ]);
    }

    rows.push([]);
    rows.push([
      '',
      '',
      `Saldo Final: ${(data as any).closingBalance || 0}`,
      '',
      '',
      (data as any).closingBalance || 0,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Mayor');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateJournalEntries(
    startDate: string,
    endDate: string,
  ): Promise<Buffer> {
    const entries = await this.journalService.findAll({ startDate, endDate });

    const rows: any[][] = [
      ...this.companyHeader('Asientos Contables', `${startDate} a ${endDate}`),
      ['Nro', 'Fecha', 'Descripción', 'Tipo', 'Cuenta', 'Débito', 'Crédito'],
    ];

    const entryList = Array.isArray(entries) ? entries : [];
    for (const entry of entryList) {
      const date = entry.entry_date
        ? new Date(entry.entry_date).toLocaleDateString('es-CO')
        : '';
      if (entry.lines && entry.lines.length > 0) {
        for (const line of entry.lines) {
          rows.push([
            entry.entry_number,
            date,
            line.description || entry.description,
            entry.source_type || '',
            line.pucAccount
              ? `${line.pucAccount.code} - ${line.pucAccount.name}`
              : '',
            line.debit || 0,
            line.credit || 0,
          ]);
        }
      } else {
        rows.push([
          entry.entry_number,
          date,
          entry.description,
          entry.source_type || '',
          '',
          entry.total_debit || 0,
          entry.total_credit || 0,
        ]);
      }
      rows.push([]); // separator between entries
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 40 },
      { wch: 12 },
      { wch: 35 },
      { wch: 18 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asientos Contables');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateExpenses(startDate: string, endDate: string): Promise<Buffer> {
    const expenses = await this.expenseService.findAll({ startDate, endDate });

    const rows: any[][] = [
      ...this.companyHeader('Reporte de Gastos', `${startDate} a ${endDate}`),
      [
        'Nro',
        'Fecha',
        'Categoría',
        'Proveedor',
        'Descripción',
        'Subtotal',
        'IVA',
        'Retención',
        'Total',
        'Estado',
      ],
    ];

    const expenseList = Array.isArray(expenses) ? expenses : [];
    for (const exp of expenseList) {
      rows.push([
        exp.expense_number || '',
        exp.expense_date
          ? new Date(exp.expense_date).toLocaleDateString('es-CO')
          : '',
        exp.expenseCategory?.name || '',
        exp.provider?.company_name || '',
        exp.description || '',
        exp.subtotal || 0,
        exp.tax_amount || 0,
        exp.retention_amount || 0,
        exp.total || 0,
        exp.payment_status || '',
      ]);
    }

    // Totals
    const totals = expenseList.reduce(
      (acc, e) => ({
        subtotal: acc.subtotal + (e.subtotal || 0),
        tax: acc.tax + (e.tax_amount || 0),
        retention: acc.retention + (e.retention_amount || 0),
        total: acc.total + (e.total || 0),
      }),
      { subtotal: 0, tax: 0, retention: 0, total: 0 },
    );

    rows.push([]);
    rows.push([
      '',
      '',
      '',
      '',
      'TOTALES',
      totals.subtotal,
      totals.tax,
      totals.retention,
      totals.total,
      '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 25 },
      { wch: 35 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gastos');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generatePayroll(periodId: number): Promise<Buffer> {
    const period = await this.payrollService.findOnePeriod(periodId);

    const periodLabel = `${period.year}-${String(period.month).padStart(2, '0')} (${period.period_type})`;

    const rows: any[][] = [
      ...this.companyHeader('Nómina', periodLabel),
      [
        'Empleado',
        'Cargo',
        'Salario Base',
        'Días',
        'Devengado',
        'Salud Emp',
        'Pensión Emp',
        'Neto',
        'Costo Total Empleador',
      ],
    ];

    const entries = period.entries || [];
    for (const entry of entries) {
      rows.push([
        entry.employee?.name || `Empleado #${entry.id_employee}`,
        entry.employee?.position || '',
        entry.base_salary || 0,
        entry.worked_days || 0,
        entry.gross_salary || 0,
        entry.health_employee || 0,
        entry.pension_employee || 0,
        entry.net_salary || 0,
        entry.total_employer_cost || 0,
      ]);
    }

    // Totals
    if (entries.length > 0) {
      const totals = entries.reduce(
        (acc: any, e: any) => ({
          base: acc.base + (e.base_salary || 0),
          gross: acc.gross + (e.gross_salary || 0),
          health: acc.health + (e.health_employee || 0),
          pension: acc.pension + (e.pension_employee || 0),
          net: acc.net + (e.net_salary || 0),
          total: acc.total + (e.total_employer_cost || 0),
        }),
        { base: 0, gross: 0, health: 0, pension: 0, net: 0, total: 0 },
      );

      rows.push([]);
      rows.push([
        'TOTALES',
        '',
        totals.base,
        '',
        totals.gross,
        totals.health,
        totals.pension,
        totals.net,
        totals.total,
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 30 },
      { wch: 20 },
      { wch: 16 },
      { wch: 8 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nómina');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // ── Aging Reports Excel Exports ───────────────────────────────

  async generateReceivablesAging(): Promise<Buffer> {
    const data = await this.agingService.getAgingReport();
    const date = new Date().toLocaleDateString('es-CO');

    const rows: any[][] = [
      ...this.companyHeader(
        'Cartera por Edades - Cuentas por Cobrar (CxC)',
        `Generado: ${date}`,
      ),
      [
        'Referencia',
        'Cliente',
        'Fecha Pedido',
        'Estado',
        'Dias Vencidos',
        'Monto',
      ],
    ];

    const bucketKeys = ['current', 'days31_60', 'days61_90', 'over90'] as const;
    const bucketLabels = {
      current: '0-30 Dias',
      days31_60: '31-60 Dias',
      days61_90: '61-90 Dias',
      over90: 'Mas de 90 Dias',
    };

    for (const key of bucketKeys) {
      const orders = data.detail[key] || [];
      if (orders.length > 0) {
        rows.push([]);
        rows.push([bucketLabels[key]]);
        for (const o of orders) {
          rows.push([
            o.orderReference || `#${o.orderId}`,
            o.customerName,
            o.orderDate
              ? new Date(o.orderDate).toLocaleDateString('es-CO')
              : '',
            o.status,
            o.daysOutstanding,
            o.amount,
          ]);
        }
        rows.push([
          '',
          '',
          '',
          '',
          `Subtotal ${bucketLabels[key]}:`,
          data.summary[key]?.total || 0,
        ]);
      }
    }

    rows.push([]);
    rows.push(['', '', '', '', 'TOTAL CARTERA:', data.totalOutstanding]);
    rows.push(['', '', '', '', 'Total Pedidos:', data.totalOrders]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 30 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CxC Cartera');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generatePayablesAging(): Promise<Buffer> {
    const data = await this.agingService.getPayablesAging();
    const date = new Date().toLocaleDateString('es-CO');

    const rows: any[][] = [
      ...this.companyHeader(
        'Cartera por Edades - Cuentas por Pagar (CxP)',
        `Generado: ${date}`,
      ),
      [
        'Nro Gasto',
        'Proveedor',
        'NIT',
        'Factura',
        'Categoría',
        'Fecha Gasto',
        'Fecha Vencimiento',
        'Dias Vencidos',
        'Monto',
      ],
    ];

    const bucketKeys = ['current', 'days31_60', 'days61_90', 'over90'] as const;
    const bucketLabels = {
      current: '0-30 Dias',
      days31_60: '31-60 Dias',
      days61_90: '61-90 Dias',
      over90: 'Mas de 90 Dias',
    };

    for (const key of bucketKeys) {
      const items = data.detail[key] || [];
      if (items.length > 0) {
        rows.push([]);
        rows.push([bucketLabels[key]]);
        for (const item of items) {
          rows.push([
            item.expenseNumber,
            item.providerName,
            item.providerNit,
            item.invoiceNumber,
            item.category,
            item.expenseDate
              ? new Date(item.expenseDate).toLocaleDateString('es-CO')
              : '',
            item.dueDate
              ? new Date(item.dueDate).toLocaleDateString('es-CO')
              : 'Sin fecha',
            item.daysOutstanding,
            item.amount,
          ]);
        }
        rows.push([
          '',
          '',
          '',
          '',
          '',
          '',
          '',
          `Subtotal ${bucketLabels[key]}:`,
          data.summary[key]?.total || 0,
        ]);
      }
    }

    rows.push([]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'TOTAL POR PAGAR:',
      data.totalOutstanding,
    ]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'Total Gastos:',
      data.totalExpenses,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 30 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
      { wch: 16 },
      { wch: 18 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'CxP Cartera');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateInventoryValuation(): Promise<Buffer> {
    const data = await this.agingService.getInventoryValuation();
    const date = new Date().toLocaleDateString('es-CO');

    const rows: any[][] = [
      ...this.companyHeader(
        'Valoración de Inventario (NIC 2 - Costo de Producción)',
        `Generado: ${date}`,
      ),
    ];

    // Summary section
    rows.push(['RESUMEN']);
    rows.push(['Productos Activos:', data.summary.totalActiveProducts]);
    rows.push(['Total Unidades:', data.summary.totalUnits]);
    rows.push(['Valor Total (Costo Producción):', data.summary.totalCostValue]);
    rows.push(['Valor Total (Precio Venta):', data.summary.totalSaleValue]);
    rows.push(['Margen Potencial:', data.summary.potentialMargin]);
    rows.push([]);

    // Detail by category
    rows.push(['DETALLE POR CATEGORÍA']);
    rows.push([]);
    rows.push([
      'Categoría',
      'SKU',
      'Producto',
      'Tipo',
      'Color',
      'Talla',
      'Cantidad',
      'Costo Unitario',
      'Precio Venta',
      'Valor Costo Total',
      'Valor Venta Total',
      'Outlet',
    ]);

    for (const cat of data.categories) {
      rows.push([]);
      rows.push([`── ${cat.categoryName} ──`]);
      for (const item of cat.items) {
        rows.push([
          cat.categoryName,
          item.sku,
          item.productName,
          item.typeName,
          item.colorName,
          item.sizeName,
          item.quantityAvailable,
          item.unitCost,
          item.unitSalePrice,
          item.lineCostValue,
          item.lineSaleValue,
          item.isOutlet ? 'Sí' : 'No',
        ]);
      }
      rows.push([
        '',
        '',
        '',
        '',
        '',
        `Subtotal ${cat.categoryName}:`,
        cat.totalUnits,
        '',
        '',
        cat.totalCostValue,
        cat.totalSaleValue,
        '',
      ]);
    }

    rows.push([]);
    rows.push([
      '',
      '',
      '',
      '',
      '',
      'TOTAL GENERAL:',
      data.summary.totalUnits,
      '',
      '',
      data.summary.totalCostValue,
      data.summary.totalSaleValue,
      '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 18 },
      { wch: 14 },
      { wch: 30 },
      { wch: 14 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 8 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Inventario');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateAnnualBudgetComparison(year: number): Promise<Buffer> {
    const data = await this.budgetService.getAnnualComparison(year);

    const headers = ['Código', 'Cuenta'];
    const months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];

    for (const m of months) {
      headers.push(`${m} Pres`);
      headers.push(`${m} Ejec`);
      headers.push(`${m} Var`);
    }
    headers.push('Total Pres', 'Total Ejec', 'Total Var', '% Var');

    const rows: any[][] = [
      ...this.companyHeader(
        'Comparativo Presupuesto vs Ejecución ANUAL',
        `Año: ${year}`,
      ),
      headers,
    ];

    for (const item of data.items) {
      const row: any[] = [item.code, item.name];
      for (const m of item.months) {
        row.push(m.budgeted, m.executed, m.variance);
      }
      row.push(
        item.totals.budgeted,
        item.totals.executed,
        item.totals.variance,
        `${item.totals.variancePercentage}%`,
      );
      rows.push(row);
    }

    // Grand Totals row
    const totalsRow: any[] = ['', 'TOTAL GENERAL'];
    for (let m = 0; m < 12; m++) {
      const monthBudgeted = data.items.reduce(
        (s, i) => s + i.months[m].budgeted,
        0,
      );
      const monthExecuted = data.items.reduce(
        (s, i) => s + i.months[m].executed,
        0,
      );
      totalsRow.push(
        monthBudgeted,
        monthExecuted,
        monthExecuted - monthBudgeted,
      );
    }
    totalsRow.push(
      data.grandTotals.budgeted,
      data.grandTotals.executed,
      data.grandTotals.variance,
      '',
    );
    rows.push([]);
    rows.push(totalsRow);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Column widths
    const colWidths = [{ wch: 12 }, { wch: 35 }];
    for (let i = 0; i < 12 * 3 + 4; i++) {
      colWidths.push({ wch: 14 });
    }
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Presupuesto Anual');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  // ── Kardex de Inventario ─────────────────────────────────────

  async generateKardex(filters: {
    startDate?: string;
    endDate?: string;
    type?: string;
    sourceType?: string;
    search?: string;
  }): Promise<Buffer> {
    // Build filter inline (avoids circular dep with InventoryModule)
    const where: any = {};
    if (filters.startDate || filters.endDate) {
      where.date = {};
      if (filters.startDate) where.date.gte = new Date(filters.startDate);
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }
    if (filters.type) where.type = filters.type;
    if (filters.sourceType) where.source_type = filters.sourceType;

    const data = await this.prisma.inventoryKardex.findMany({
      where,
      include: {
        clothingSize: {
          include: {
            clothingColor: {
              include: {
                design: { include: { clothing: true } },
                color: true,
              },
            },
            size: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const date = new Date().toLocaleDateString('es-CO');

    const periodLabel = filters.startDate && filters.endDate
      ? `${filters.startDate} a ${filters.endDate}`
      : `Generado: ${date}`;

    const rows: any[][] = [
      ...this.companyHeader('Kardex de Inventario', periodLabel),
      [
        'Fecha',
        'Referencia',
        'Producto',
        'Color',
        'Talla',
        'Tipo',
        'Origen',
        'Ref. Origen',
        'Cantidad',
        'Saldo Antes',
        'Saldo Después',
        'Costo Unitario',
        'Valor Total',
        'Descripción',
      ],
    ];

    for (const mov of data) {
      const cs = mov.clothingSize;
      const cc = cs?.clothingColor;
      const design = cc?.design;

      rows.push([
        mov.date
          ? new Date(mov.date).toLocaleDateString('es-CO')
          : '',
        design?.reference || '',
        design?.clothing?.name || '',
        cc?.color?.name || '',
        cs?.size?.name || '',
        mov.type || '',
        mov.source_type || '',
        mov.source_id || '',
        mov.quantity || 0,
        mov.balance_before ?? '',
        mov.balance_after ?? '',
        mov.unit_cost || 0,
        Math.abs(mov.quantity || 0) * (mov.unit_cost || 0),
        mov.description || '',
      ]);
    }

    // Totales
    const totals = data.reduce(
      (acc, m) => ({
        entradas: acc.entradas + (m.type === 'ENTRADA' || m.type === 'IN' ? Math.abs(m.quantity || 0) : 0),
        salidas: acc.salidas + (m.type === 'SALIDA' || m.type === 'OUT' ? Math.abs(m.quantity || 0) : 0),
        valorTotal: acc.valorTotal + Math.abs(m.quantity || 0) * (m.unit_cost || 0),
      }),
      { entradas: 0, salidas: 0, valorTotal: 0 },
    );

    rows.push([]);
    rows.push([
      '', '', '', '', '',
      'TOTALES',
      '',
      '',
      `E: ${totals.entradas} / S: ${totals.salidas}`,
      '', '', '',
      totals.valorTotal,
      `${data.length} movimientos`,
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 },
      { wch: 12 },
      { wch: 30 },
      { wch: 12 },
      { wch: 8 },
      { wch: 10 },
      { wch: 14 },
      { wch: 10 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 40 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Kardex');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
