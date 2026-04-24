import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Alertas contables: agregador read-only que expone problemas para visibilidad
 * operativa. Cubre:
 *  - Asientos en DRAFT con > N días sin POSTED
 *  - Cuentas PUC sin movimientos en > 12 meses (candidatas a desactivar)
 *  - Movimientos POSTED sobre cuentas que no aceptan movimientos
 *  - Cuentas huérfanas (parent_code apunta a inexistente)
 *  - Próximos vencimientos fiscales (calendario fijo simplificado)
 *  - Períodos contables sin cerrar al día N del mes siguiente
 */
@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(opts: { draftDays?: number; idleMonths?: number } = {}) {
    const draftDays = opts.draftDays ?? 7;
    const idleMonths = opts.idleMonths ?? 12;

    const draftCutoff = new Date();
    draftCutoff.setDate(draftCutoff.getDate() - draftDays);

    const idleCutoff = new Date();
    idleCutoff.setMonth(idleCutoff.getMonth() - idleMonths);

    // Órdenes pagadas que aún no tienen factura DIAN — riesgo fiscal
    const unbilledCutoff = new Date();
    unbilledCutoff.setDate(unbilledCutoff.getDate() - 1); // > 1 día sin factura

    const [staleDrafts, invalidLines, orphans, periodsToClose, unbilledOrders] =
      await Promise.all([
        this.prisma.journalEntry.findMany({
          where: { status: 'DRAFT', createdAt: { lt: draftCutoff } },
          select: {
            id: true,
            entry_number: true,
            createdAt: true,
            description: true,
            source_type: true,
            total_debit: true,
          },
          orderBy: { createdAt: 'asc' },
        }),
        this.prisma.journalEntryLine.findMany({
          where: {
            journalEntry: { status: 'POSTED' },
            pucAccount: { accepts_movements: false },
          },
          select: {
            id: true,
            debit: true,
            credit: true,
            pucAccount: { select: { code: true, name: true } },
            journalEntry: { select: { entry_number: true, entry_date: true } },
          },
          take: 50,
        }),
        this.prisma.pucAccount.findMany({
          where: {
            parent_code: { not: null },
          },
          select: { id: true, code: true, name: true, parent_code: true },
        }),
        this.findUnclosedPeriods(),
        this.prisma.order.findMany({
          where: {
            is_paid: true,
            createdAt: { lt: unbilledCutoff },
            dianEInvoicings: { none: {} },
          },
          select: {
            id: true,
            order_reference: true,
            createdAt: true,
            total_payment: true,
            status: true,
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        }),
      ]);

    // Filtra cuentas PUC huérfanas
    const allCodes = new Set(
      (await this.prisma.pucAccount.findMany({ select: { code: true } })).map(
        (a) => a.code,
      ),
    );
    const orphanAccounts = orphans.filter(
      (a) => a.parent_code && !allCodes.has(a.parent_code),
    );

    // Cuentas inactivas por uso (sin líneas en los últimos N meses)
    const recentlyUsedAccountIds = new Set(
      (
        await this.prisma.journalEntryLine.findMany({
          where: { journalEntry: { entry_date: { gte: idleCutoff } } },
          distinct: ['id_puc_account'],
          select: { id_puc_account: true },
        })
      ).map((l) => l.id_puc_account),
    );
    const allMovementAccounts = await this.prisma.pucAccount.findMany({
      where: { accepts_movements: true, is_active: true },
      select: { id: true, code: true, name: true },
    });
    const idleAccounts = allMovementAccounts.filter(
      (a) => !recentlyUsedAccountIds.has(a.id),
    );

    // Próximos vencimientos fiscales (calendario aproximado)
    const fiscalDeadlines = this.computeFiscalDeadlines();

    return {
      generated_at: new Date(),
      summary: {
        stale_drafts: staleDrafts.length,
        invalid_movements: invalidLines.length,
        orphan_accounts: orphanAccounts.length,
        idle_accounts: idleAccounts.length,
        unclosed_periods: periodsToClose.length,
        next_fiscal_deadlines: fiscalDeadlines.length,
        unbilled_orders: unbilledOrders.length,
      },
      stale_drafts: staleDrafts,
      invalid_movements: invalidLines.map((l) => ({
        line_id: l.id,
        entry_number: l.journalEntry.entry_number,
        entry_date: l.journalEntry.entry_date,
        account_code: l.pucAccount.code,
        account_name: l.pucAccount.name,
        debit: l.debit,
        credit: l.credit,
      })),
      orphan_accounts: orphanAccounts,
      idle_accounts: idleAccounts,
      unclosed_periods: periodsToClose,
      fiscal_deadlines: fiscalDeadlines,
      unbilled_orders: unbilledOrders,
    };
  }

  private async findUnclosedPeriods() {
    // Períodos del año actual que aún están abiertos cuando ya pasaron > 5 días
    // del mes siguiente.
    const now = new Date();
    const result: { year: number; month: number; days_overdue: number }[] = [];

    for (let i = 1; i <= 12; i++) {
      const periodEnd = new Date(now.getFullYear(), i, 0); // último día del mes i
      if (periodEnd >= now) break;
      const cutoff = new Date(now.getFullYear(), i, 5); // día 5 del mes siguiente
      if (now <= cutoff) continue;

      const closed = await this.prisma.accountingClosing.findFirst({
        where: { year: now.getFullYear(), month: i, status: 'CLOSED' },
      });
      if (!closed) {
        const daysOverdue = Math.floor(
          (now.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24),
        );
        result.push({
          year: now.getFullYear(),
          month: i,
          days_overdue: daysOverdue,
        });
      }
    }
    return result;
  }

  private computeFiscalDeadlines(): Array<{
    name: string;
    date: Date;
    days_left: number;
  }> {
    // Calendario fiscal simplificado — vencimientos genéricos mensuales.
    // En producción se debería leer de una tabla configurable.
    const now = new Date();
    const candidates = [
      { name: 'Declaración IVA bimestral', day: 12 },
      { name: 'ReteFuente / ReteIVA / ReteICA', day: 18 },
      { name: 'PILA / Aportes parafiscales', day: 5 },
      { name: 'Cierre contable mensual', day: 5 },
    ];
    return candidates
      .map((c) => {
        const date = new Date(now.getFullYear(), now.getMonth(), c.day);
        if (date < now) date.setMonth(date.getMonth() + 1);
        const daysLeft = Math.ceil(
          (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        return { name: c.name, date, days_left: daysLeft };
      })
      .sort((a, b) => a.days_left - b.days_left)
      .filter((d) => d.days_left <= 14);
  }
}
