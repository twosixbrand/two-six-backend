import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AccountingDashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboard() {
    const now = new Date();
    const month = now.getMonth() + 1; // 1-based
    const year = now.getFullYear();

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // ── Ventas del Mes: sum of SALE journal entries this month ──
    const saleEntries = await this.prisma.journalEntry.findMany({
      where: {
        source_type: 'SALE',
        entry_date: { gte: startOfMonth, lte: endOfMonth },
        status: 'POSTED',
      },
      select: { total_debit: true },
    });
    const ventasMes = saleEntries.reduce((sum, e) => sum + e.total_debit, 0);

    // ── Gastos del Mes: sum of EXPENSE journal entries this month ──
    const expenseEntries = await this.prisma.journalEntry.findMany({
      where: {
        source_type: 'EXPENSE',
        entry_date: { gte: startOfMonth, lte: endOfMonth },
        status: 'POSTED',
      },
      select: { total_debit: true },
    });
    const gastosMes = expenseEntries.reduce((sum, e) => sum + e.total_debit, 0);

    const utilidadMes = ventasMes - gastosMes;
    const margenUtilidad =
      ventasMes > 0 ? Math.round((utilidadMes / ventasMes) * 10000) / 100 : 0;

    // ── IVA Generado: credit to 240801 this month ──
    const ivaGeneradoLines = await this.prisma.journalEntryLine.findMany({
      where: {
        pucAccount: { code: '240801' },
        credit: { gt: 0 },
        journalEntry: {
          entry_date: { gte: startOfMonth, lte: endOfMonth },
          status: 'POSTED',
        },
      },
      select: { credit: true },
    });
    const ivaGenerado = ivaGeneradoLines.reduce((sum, l) => sum + l.credit, 0);

    // ── IVA Descontable: debit to 240802 this month ──
    const ivaDescontableLines = await this.prisma.journalEntryLine.findMany({
      where: {
        pucAccount: { code: '240802' },
        debit: { gt: 0 },
        journalEntry: {
          entry_date: { gte: startOfMonth, lte: endOfMonth },
          status: 'POSTED',
        },
      },
      select: { debit: true },
    });
    const ivaDescontable = ivaDescontableLines.reduce(
      (sum, l) => sum + l.debit,
      0,
    );

    const ivaPorPagar = ivaGenerado - ivaDescontable;

    // ── Cuentas por Pagar: balance of 2205 (Proveedores) ──
    const cxpLines = await this.prisma.journalEntryLine.findMany({
      where: {
        pucAccount: { code: { startsWith: '2205' } },
        journalEntry: { status: 'POSTED' },
      },
      select: { debit: true, credit: true },
    });
    const cuentasPorPagar = cxpLines.reduce(
      (sum, l) => sum + l.credit - l.debit,
      0,
    );

    // ── Cuentas por Cobrar: balance of 1305 (Clientes) ──
    const cxcLines = await this.prisma.journalEntryLine.findMany({
      where: {
        pucAccount: { code: { startsWith: '1305' } },
        journalEntry: { status: 'POSTED' },
      },
      select: { debit: true, credit: true },
    });
    const cuentasPorCobrar = cxcLines.reduce(
      (sum, l) => sum + l.debit - l.credit,
      0,
    );

    // ── Total órdenes pagadas del mes ──
    const totalOrdenesMes = await this.prisma.order.count({
      where: {
        is_paid: true,
        purchase_date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // ── Total gastos del mes ──
    const totalGastosMes = await this.prisma.expense.count({
      where: {
        expense_date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // ── Top 5 expense categories this month ──
    const expenses = await this.prisma.expense.findMany({
      where: {
        expense_date: { gte: startOfMonth, lte: endOfMonth },
      },
      include: { expenseCategory: true },
    });

    const categoryTotals: Record<string, number> = {};
    for (const exp of expenses) {
      const cat = exp.expenseCategory?.name ?? 'Sin categoría';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + exp.total;
    }

    const topGastos = Object.entries(categoryTotals)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);

    // ── Last 5 audit log entries ──
    const auditRecent = await this.prisma.accountingAuditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      period: { month, year },
      ventasMes: Math.round(ventasMes * 100) / 100,
      gastosMes: Math.round(gastosMes * 100) / 100,
      utilidadMes: Math.round(utilidadMes * 100) / 100,
      margenUtilidad,
      ivaGenerado: Math.round(ivaGenerado * 100) / 100,
      ivaDescontable: Math.round(ivaDescontable * 100) / 100,
      ivaPorPagar: Math.round(ivaPorPagar * 100) / 100,
      cuentasPorPagar: Math.round(cuentasPorPagar * 100) / 100,
      cuentasPorCobrar: Math.round(cuentasPorCobrar * 100) / 100,
      totalOrdenesMes,
      totalGastosMes,
      topGastos,
      auditRecent,
    };
  }
}
