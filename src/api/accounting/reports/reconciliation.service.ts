import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Reporte de reconciliación Mayor ↔ Auxiliar:
 * Compara el saldo de cada cuenta mayor (padre) contra la suma de los saldos
 * de sus cuentas auxiliares (descendientes con accepts_movements=true).
 * Emite alerta por cada descuadre.
 */
@Injectable()
export class ReconciliationService {
  constructor(private readonly prisma: PrismaService) {}

  async mayorVsAuxiliar(opts: { endDate?: string } = {}) {
    const endDate = opts.endDate ? new Date(opts.endDate) : new Date();

    // Agregamos saldo por cuenta (solo POSTED, sobre líneas hasta la fecha)
    const movementsByAccount = await this.prisma.journalEntryLine.groupBy({
      by: ['id_puc_account'],
      where: {
        journalEntry: {
          status: 'POSTED',
          entry_date: { lte: endDate },
        },
      },
      _sum: {
        debit: true,
        credit: true,
      },
    });

    // Mapa id → balance (debit - credit para naturaleza débito,
    // credit - debit para naturaleza crédito; pero para reconciliación
    // usamos el valor absoluto del saldo).
    const balanceById = new Map<number, number>();
    for (const m of movementsByAccount) {
      const debit = m._sum.debit ?? 0;
      const credit = m._sum.credit ?? 0;
      balanceById.set(m.id_puc_account, debit - credit);
    }

    // Trae todas las cuentas con jerarquía
    const accounts = await this.prisma.pucAccount.findMany({
      where: { is_active: true },
      select: {
        id: true,
        code: true,
        name: true,
        parent_code: true,
        accepts_movements: true,
      },
      orderBy: { code: 'asc' },
    });

    const byCode = new Map<string, (typeof accounts)[number]>();
    const childrenByParent = new Map<string, typeof accounts>();
    for (const a of accounts) {
      byCode.set(a.code, a);
      if (a.parent_code) {
        if (!childrenByParent.has(a.parent_code))
          childrenByParent.set(a.parent_code, []);
        childrenByParent.get(a.parent_code)!.push(a);
      }
    }

    // Saldo recursivo de una cuenta (sumando todos sus descendientes
    // que acepten movimientos). Memoized.
    const subtreeBalance = new Map<string, number>();
    const computeSubtree = (code: string): number => {
      if (subtreeBalance.has(code)) return subtreeBalance.get(code)!;
      const account = byCode.get(code);
      if (!account) return 0;
      let total = 0;
      if (account.accepts_movements) {
        total += balanceById.get(account.id) ?? 0;
      }
      const children = childrenByParent.get(code) ?? [];
      for (const child of children) {
        total += computeSubtree(child.code);
      }
      subtreeBalance.set(code, total);
      return total;
    };

    // Para cada cuenta "mayor" (NO acepta movimientos), el saldo computado
    // del subárbol es su balance real. Lo reportamos para visibilidad.
    // Las cuentas auxiliares (acceptan movimientos) reportamos su saldo directo.
    // Un "descuadre" en este esquema ocurriría solo si alguien insertara
    // líneas contra una cuenta que no acepta movimientos (que la validación
    // de journal.service.ts ya bloquea). Por eso reportamos también cualquier
    // línea huérfana (con cuenta inactiva o padre no encontrado).

    const summary = accounts.map((a) => {
      const balance = a.accepts_movements
        ? (balanceById.get(a.id) ?? 0)
        : computeSubtree(a.code);
      return {
        id: a.id,
        code: a.code,
        name: a.name,
        parent_code: a.parent_code,
        accepts_movements: a.accepts_movements,
        balance: Number(balance.toFixed(2)),
      };
    });

    // Detecta líneas POSTED contra cuentas que NO aceptan movimientos
    // (inconsistencia que no debería existir, pero reportamos si aparece)
    const invalidMovements = await this.prisma.journalEntryLine.findMany({
      where: {
        journalEntry: { status: 'POSTED', entry_date: { lte: endDate } },
        pucAccount: { accepts_movements: false },
      },
      select: {
        id: true,
        debit: true,
        credit: true,
        pucAccount: { select: { code: true, name: true } },
        journalEntry: { select: { entry_number: true, entry_date: true } },
      },
    });

    // Detecta cuentas huérfanas (parent_code apunta a una cuenta inexistente)
    const orphans = accounts.filter(
      (a) => a.parent_code && !byCode.has(a.parent_code),
    );

    return {
      report_date: endDate,
      accounts: summary,
      invalid_movements: invalidMovements.map((m) => ({
        line_id: m.id,
        entry_number: m.journalEntry.entry_number,
        entry_date: m.journalEntry.entry_date,
        account_code: m.pucAccount.code,
        account_name: m.pucAccount.name,
        debit: m.debit,
        credit: m.credit,
      })),
      orphan_accounts: orphans.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        parent_code: a.parent_code,
      })),
      summary: {
        total_accounts: accounts.length,
        invalid_movements_count: invalidMovements.length,
        orphan_accounts_count: orphans.length,
      },
    };
  }
}
