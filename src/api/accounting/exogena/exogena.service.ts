import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExogenaService {
  constructor(private prisma: PrismaService) {}

  /**
   * Preview Información Exógena data for a given year.
   * Returns structured data per DIAN format (1001, 1005, 1006, 1007).
   */
  async preview(year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // ── Format 1001: Pagos a terceros ──────────────────────────
    const expenses = await this.prisma.expense.findMany({
      where: {
        expense_date: { gte: startDate, lte: endDate },
        payment_status: { in: ['PAID', 'PENDING', 'PARTIAL'] },
      },
      include: {
        provider: true,
        expenseCategory: true,
      },
    });

    // Group by provider
    const providerMap: Record<string, {
      nit: string;
      name: string;
      concept: string;
      base_amount: number;
      retention_amount: number;
      tax_amount: number;
    }> = {};

    for (const exp of expenses) {
      const providerId = exp.id_provider || '0';
      if (!providerMap[providerId]) {
        providerMap[providerId] = {
          nit: exp.provider?.id || 'Sin NIT',
          name: exp.provider?.company_name || 'Sin proveedor',
          concept: exp.expenseCategory?.name || 'Otros',
          base_amount: 0,
          retention_amount: 0,
          tax_amount: 0,
        };
      }
      providerMap[providerId].base_amount += exp.subtotal || 0;
      providerMap[providerId].retention_amount += exp.retention_amount || 0;
      providerMap[providerId].tax_amount += exp.tax_amount || 0;
    }

    // Filter providers above threshold ($100,000 COP)
    const THRESHOLD = 100000;
    const format1001 = Object.values(providerMap)
      .filter(p => p.base_amount > THRESHOLD)
      .sort((a, b) => b.base_amount - a.base_amount);

    // ── Format 1005: IVA Descontable ───────────────────────────
    const format1005 = Object.values(providerMap)
      .filter(p => p.tax_amount > 0)
      .map(p => ({
        nit: p.nit,
        name: p.name,
        iva_descontable: p.tax_amount,
      }))
      .sort((a, b) => b.iva_descontable - a.iva_descontable);

    // ── Format 1006: IVA Generado ──────────────────────────────
    // Aggregate IVA from journal entries with source_type SALE by month
    const saleEntries = await this.prisma.journalEntry.findMany({
      where: {
        status: 'POSTED',
        source_type: 'SALE',
        entry_date: { gte: startDate, lte: endDate },
      },
      include: {
        lines: {
          include: { pucAccount: true },
        },
      },
    });

    const ivaByMonth: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) ivaByMonth[m] = 0;

    for (const entry of saleEntries) {
      const month = new Date(entry.entry_date).getMonth() + 1;
      for (const line of entry.lines) {
        // IVA accounts typically start with 2408
        if (line.pucAccount?.code?.startsWith('2408')) {
          ivaByMonth[month] += line.credit || 0;
        }
      }
    }

    const format1006 = Object.entries(ivaByMonth)
      .filter(([, amount]) => amount > 0)
      .map(([month, amount]) => ({
        month: parseInt(month),
        iva_generado: amount,
      }));

    // ── Format 1007: Ingresos por cliente ──────────────────────
    // Aggregate revenue from orders
    let format1007: any[] = [];
    try {
      const orders = await (this.prisma as any).order.findMany({
        where: {
          created_at: { gte: startDate, lte: endDate },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        include: {
          customer: true,
        },
      });

      const customerMap: Record<number, {
        nit: string;
        name: string;
        total_revenue: number;
      }> = {};

      for (const order of orders) {
        const custId = order.id_customer || 0;
        if (!customerMap[custId]) {
          customerMap[custId] = {
            nit: order.customer?.document_number || 'Sin NIT',
            name: order.customer?.name || order.customer?.first_name
              ? `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim()
              : 'Consumidor final',
            total_revenue: 0,
          };
        }
        customerMap[custId].total_revenue += order.total || order.total_amount || 0;
      }

      format1007 = Object.values(customerMap)
        .filter(c => c.total_revenue > THRESHOLD)
        .sort((a, b) => b.total_revenue - a.total_revenue);
    } catch {
      // Order model may not exist, return empty
      format1007 = [];
    }

    // Summary
    const totalProviders = format1001.length;
    const totalCustomers = format1007.length;
    const totalPayments = format1001.reduce((s, p) => s + p.base_amount, 0);
    const totalRevenue = format1007.reduce((s, c) => s + c.total_revenue, 0);

    return {
      year,
      summary: {
        totalProviders,
        totalCustomers,
        totalPayments: Math.round(totalPayments),
        totalRevenue: Math.round(totalRevenue),
        totalIvaDescontable: Math.round(format1005.reduce((s, p) => s + p.iva_descontable, 0)),
        totalIvaGenerado: Math.round(format1006.reduce((s, p) => s + p.iva_generado, 0)),
      },
      format1001,
      format1005,
      format1006,
      format1007,
    };
  }

  /**
   * Generate Excel file with one sheet per DIAN format.
   */
  async generateExcel(year: number): Promise<Buffer> {
    const data = await this.preview(year);

    const wb = XLSX.utils.book_new();

    const companyHeader = (title: string): string[][] => [
      ['TWO SIX S.A.S.'],
      ['NIT: 901.XXX.XXX-X'],
      [`Información Exógena - ${title}`],
      [`Año Gravable: ${year}`],
      [],
    ];

    // ── Sheet 1001: Pagos a terceros ─────────────────────────
    const rows1001: any[][] = [
      ...companyHeader('Formato 1001 - Pagos a Terceros'),
      ['NIT Proveedor', 'Razón Social', 'Concepto', 'Base Gravable', 'Retención', 'IVA'],
    ];
    for (const item of data.format1001) {
      rows1001.push([
        item.nit,
        item.name,
        item.concept,
        Math.round(item.base_amount),
        Math.round(item.retention_amount),
        Math.round(item.tax_amount),
      ]);
    }
    rows1001.push([]);
    rows1001.push([
      '', 'TOTALES', '',
      Math.round(data.format1001.reduce((s, p) => s + p.base_amount, 0)),
      Math.round(data.format1001.reduce((s, p) => s + p.retention_amount, 0)),
      Math.round(data.format1001.reduce((s, p) => s + p.tax_amount, 0)),
    ]);

    const ws1001 = XLSX.utils.aoa_to_sheet(rows1001);
    ws1001['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws1001, '1001-Pagos Terceros');

    // ── Sheet 1005: IVA Descontable ──────────────────────────
    const rows1005: any[][] = [
      ...companyHeader('Formato 1005 - IVA Descontable'),
      ['NIT Proveedor', 'Razón Social', 'IVA Descontable'],
    ];
    for (const item of data.format1005) {
      rows1005.push([item.nit, item.name, Math.round(item.iva_descontable)]);
    }
    rows1005.push([]);
    rows1005.push([
      '', 'TOTAL',
      Math.round(data.format1005.reduce((s, p) => s + p.iva_descontable, 0)),
    ]);

    const ws1005 = XLSX.utils.aoa_to_sheet(rows1005);
    ws1005['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1005, '1005-IVA Descontable');

    // ── Sheet 1006: IVA Generado ─────────────────────────────
    const monthNames = [
      '', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];
    const rows1006: any[][] = [
      ...companyHeader('Formato 1006 - IVA Generado'),
      ['Mes', 'IVA Generado'],
    ];
    for (const item of data.format1006) {
      rows1006.push([monthNames[item.month] || `Mes ${item.month}`, Math.round(item.iva_generado)]);
    }
    rows1006.push([]);
    rows1006.push([
      'TOTAL',
      Math.round(data.format1006.reduce((s, p) => s + p.iva_generado, 0)),
    ]);

    const ws1006 = XLSX.utils.aoa_to_sheet(rows1006);
    ws1006['!cols'] = [{ wch: 16 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1006, '1006-IVA Generado');

    // ── Sheet 1007: Ingresos ────────────────────────────────
    const rows1007: any[][] = [
      ...companyHeader('Formato 1007 - Ingresos Recibidos de Terceros'),
      ['NIT / CC Cliente', 'Nombre / Razón Social', 'Ingresos Brutos'],
    ];
    for (const item of data.format1007) {
      rows1007.push([item.nit, item.name, Math.round(item.total_revenue)]);
    }
    rows1007.push([]);
    rows1007.push([
      '', 'TOTAL',
      Math.round(data.format1007.reduce((s, c) => s + c.total_revenue, 0)),
    ]);

    const ws1007 = XLSX.utils.aoa_to_sheet(rows1007);
    ws1007['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws1007, '1007-Ingresos');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
