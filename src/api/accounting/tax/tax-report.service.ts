import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TaxReportService {
  constructor(private prisma: PrismaService) {}

  /**
   * Declaracion de IVA — Formulario 300
   * IVA Generado (240801) vs IVA Descontable (240802)
   */
  async getIvaDeclaration(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // IVA Generado: credit entries to account 240801
    const ivaGeneradoAccount = await this.prisma.pucAccount.findUnique({
      where: { code: '240801' },
    });

    // IVA Descontable: debit entries to account 240802
    const ivaDescontableAccount = await this.prisma.pucAccount.findUnique({
      where: { code: '240802' },
    });

    let ivaGeneradoEntries: any[] = [];
    let ivaGeneradoTotal = 0;
    let ivaDescontableEntries: any[] = [];
    let ivaDescontableTotal = 0;

    if (ivaGeneradoAccount) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          id_puc_account: ivaGeneradoAccount.id,
          journalEntry: {
            status: 'POSTED',
            entry_date: { gte: start, lte: end },
          },
        },
        include: {
          journalEntry: true,
        },
        orderBy: {
          journalEntry: { entry_date: 'asc' },
        },
      });

      ivaGeneradoEntries = lines.map((line) => ({
        date: line.journalEntry.entry_date,
        entry_number: line.journalEntry.entry_number,
        description: line.description || line.journalEntry.description,
        credit: line.credit,
        debit: line.debit,
      }));

      // IVA Generado is a credit-nature account (pasivo), sum credits minus debits
      ivaGeneradoTotal = lines.reduce((sum, l) => sum + l.credit - l.debit, 0);
    }

    if (ivaDescontableAccount) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          id_puc_account: ivaDescontableAccount.id,
          journalEntry: {
            status: 'POSTED',
            entry_date: { gte: start, lte: end },
          },
        },
        include: {
          journalEntry: true,
        },
        orderBy: {
          journalEntry: { entry_date: 'asc' },
        },
      });

      ivaDescontableEntries = lines.map((line) => ({
        date: line.journalEntry.entry_date,
        entry_number: line.journalEntry.entry_number,
        description: line.description || line.journalEntry.description,
        debit: line.debit,
        credit: line.credit,
      }));

      // IVA Descontable is a debit-nature account (activo), sum debits minus credits
      ivaDescontableTotal = lines.reduce(
        (sum, l) => sum + l.debit - l.credit,
        0,
      );
    }

    const ivaPorPagar = ivaGeneradoTotal - ivaDescontableTotal;

    return {
      period: { startDate, endDate },
      ivaGenerado: {
        total: ivaGeneradoTotal,
        entries: ivaGeneradoEntries,
      },
      ivaDescontable: {
        total: ivaDescontableTotal,
        entries: ivaDescontableEntries,
      },
      ivaPorPagar,
      formulario300: {
        renglon32: ivaGeneradoTotal,
        renglon50: ivaDescontableTotal,
        renglon60: ivaPorPagar,
      },
    };
  }

  /**
   * Exporta la declaración IVA a CSV (Excel-compatible) listo para presentación
   * en Formulario 300 DIAN. Incluye cabecera con totales y detalle de cada
   * movimiento en hojas concatenadas.
   */
  async exportIvaDeclarationCsv(
    startDate: string,
    endDate: string,
  ): Promise<{ filename: string; content: string }> {
    const declaration = await this.getIvaDeclaration(startDate, endDate);
    const money = (n: number) => n.toFixed(2);
    const esc = (s: any) => {
      const v = String(s ?? '');
      return v.includes(',') || v.includes('"') || v.includes('\n')
        ? `"${v.replace(/"/g, '""')}"`
        : v;
    };

    const lines: string[] = [];
    lines.push('DECLARACIÓN DE IVA - FORMULARIO 300');
    lines.push(`Período,${startDate},${endDate}`);
    lines.push('');
    lines.push('RESUMEN');
    lines.push('Renglón,Concepto,Valor');
    lines.push(
      `32,IVA Generado (ventas),${money(declaration.ivaGenerado.total)}`,
    );
    lines.push(
      `50,IVA Descontable (compras),${money(declaration.ivaDescontable.total)}`,
    );
    lines.push(
      `60,IVA por Pagar / Saldo a Favor,${money(declaration.ivaPorPagar)}`,
    );
    lines.push('');

    lines.push('DETALLE IVA GENERADO');
    lines.push('Fecha,Asiento,Descripción,Débito,Crédito');
    for (const e of declaration.ivaGenerado.entries) {
      lines.push(
        [
          new Date(e.date).toISOString().slice(0, 10),
          esc(e.entry_number),
          esc(e.description),
          money(e.debit),
          money(e.credit),
        ].join(','),
      );
    }
    lines.push('');

    lines.push('DETALLE IVA DESCONTABLE');
    lines.push('Fecha,Asiento,Descripción,Débito,Crédito');
    for (const e of declaration.ivaDescontable.entries) {
      lines.push(
        [
          new Date(e.date).toISOString().slice(0, 10),
          esc(e.entry_number),
          esc(e.description),
          money(e.debit),
          money(e.credit),
        ].join(','),
      );
    }

    return {
      filename: `iva-${startDate}-a-${endDate}.csv`,
      content: lines.join('\n') + '\n',
    };
  }

  /**
   * Declaracion de Retencion en la Fuente — Formulario 350
   * Groups expenses with retention by PUC concept code (2365xx)
   */
  async getReteFuenteDeclaration(year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // Get all expenses in the period that have retention
    const expenses = await this.prisma.expense.findMany({
      where: {
        expense_date: { gte: startDate, lte: endDate },
        retention_amount: { gt: 0 },
      },
      include: {
        pucAccount: true,
        expenseCategory: true,
      },
      orderBy: { expense_date: 'asc' },
    });

    // Also query journal entry lines for ReteFuente accounts (2365xx)
    const reteFuenteAccounts = await this.prisma.pucAccount.findMany({
      where: {
        code: { startsWith: '2365' },
      },
    });

    const reteFuenteAccountIds = reteFuenteAccounts.map((a) => a.id);

    const reteFuenteLines = await this.prisma.journalEntryLine.findMany({
      where: {
        id_puc_account: { in: reteFuenteAccountIds },
        journalEntry: {
          status: 'POSTED',
          entry_date: { gte: startDate, lte: endDate },
        },
      },
      include: {
        pucAccount: true,
        journalEntry: true,
      },
    });

    // Build concept map from journal lines grouped by PUC account
    const conceptMap: Record<
      string,
      {
        concept: string;
        code: string;
        base: number;
        retencion: number;
        entries: any[];
      }
    > = {};

    // Predefined retention concepts with their typical rates
    const conceptRates: Record<string, { concept: string; rate: number }> = {
      '236515': { concept: 'Honorarios', rate: 11 },
      '236525': { concept: 'Compras', rate: 2.5 },
      '236530': { concept: 'Servicios', rate: 4 },
      '236540': { concept: 'Arrendamientos', rate: 3.5 },
      '236545': { concept: 'Rendimientos Financieros', rate: 7 },
    };

    for (const line of reteFuenteLines) {
      const code = line.pucAccount.code;
      if (!conceptMap[code]) {
        const meta = conceptRates[code] || {
          concept: line.pucAccount.name,
          rate: 0,
        };
        conceptMap[code] = {
          concept: meta.concept,
          code,
          base: 0,
          retencion: 0,
          entries: [],
        };
      }

      // Credit to ReteFuente account = retention amount
      const retencion = line.credit - line.debit;
      conceptMap[code].retencion += retencion;

      // Estimate base from retention and known rate
      const meta = conceptRates[code];
      if (meta && meta.rate > 0) {
        conceptMap[code].base += (retencion / meta.rate) * 100;
      }

      conceptMap[code].entries.push({
        date: line.journalEntry.entry_date,
        entry_number: line.journalEntry.entry_number,
        description: line.description || line.journalEntry.description,
        amount: retencion,
      });
    }

    // If no journal lines but we have expenses with retention, use expense data
    if (reteFuenteLines.length === 0 && expenses.length > 0) {
      for (const expense of expenses) {
        const categoryName = expense.expenseCategory.name;
        const key = categoryName;
        if (!conceptMap[key]) {
          conceptMap[key] = {
            concept: categoryName,
            code: expense.pucAccount.code,
            base: 0,
            retencion: 0,
            entries: [],
          };
        }
        conceptMap[key].base += expense.subtotal;
        conceptMap[key].retencion += expense.retention_amount;
        conceptMap[key].entries.push({
          date: expense.expense_date,
          expense_number: expense.expense_number,
          description: expense.description,
          amount: expense.retention_amount,
        });
      }
    }

    const conceptos = Object.values(conceptMap).map((c) => ({
      concept: c.concept,
      code: c.code,
      base: c.base,
      rate: c.base > 0 ? (c.retencion / c.base) * 100 : 0,
      retencion: c.retencion,
      entries: c.entries,
    }));

    const totalRetencion = conceptos.reduce((sum, c) => sum + c.retencion, 0);

    return {
      period: { year, month },
      conceptos,
      totalRetencion,
      formulario350: {
        totalRetenciones: totalRetencion,
      },
    };
  }
}
