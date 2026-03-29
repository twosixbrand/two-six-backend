import { Injectable } from '@nestjs/common';
import { AccountingReportService } from '../reports/accounting-report.service';
import { ExpenseService } from '../expense/expense.service';
import { PayrollService } from '../payroll/payroll.service';
import { JournalService } from '../journal/journal.service';
import * as XLSX from 'xlsx';

@Injectable()
export class ExportService {
  constructor(
    private readonly reportService: AccountingReportService,
    private readonly expenseService: ExpenseService,
    private readonly payrollService: PayrollService,
    private readonly journalService: JournalService,
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
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
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
    rows.push(['', 'Total Activos', '', '', data.balanceCheck?.totalActivos || 0]);
    rows.push(['', 'Total Pasivos + Patrimonio', '', '', data.balanceCheck?.totalPasivosPatrimonio || 0]);
    rows.push(['', 'Cuadrado', '', '', data.balanceCheck?.balanced ? 'SI' : 'NO']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance General');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateIncomeStatement(startDate: string, endDate: string): Promise<Buffer> {
    const data = await this.reportService.getIncomeStatement(startDate, endDate);

    const rows: any[][] = [
      ...this.companyHeader('Estado de Resultados', `${startDate} a ${endDate}`),
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

  async generateGeneralLedger(account: string, startDate: string, endDate: string): Promise<Buffer> {
    const data = await this.reportService.getGeneralLedger(account, startDate, endDate);

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
    rows.push(['', '', `Saldo Final: ${(data as any).closingBalance || 0}`, '', '', (data as any).closingBalance || 0]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 40 }, { wch: 18 }, { wch: 18 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Libro Mayor');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateJournalEntries(startDate: string, endDate: string): Promise<Buffer> {
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
            line.pucAccount ? `${line.pucAccount.code} - ${line.pucAccount.name}` : '',
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
    ws['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 40 }, { wch: 12 }, { wch: 35 }, { wch: 18 }, { wch: 18 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Asientos Contables');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }

  async generateExpenses(startDate: string, endDate: string): Promise<Buffer> {
    const expenses = await this.expenseService.findAll({ startDate, endDate });

    const rows: any[][] = [
      ...this.companyHeader('Reporte de Gastos', `${startDate} a ${endDate}`),
      ['Nro', 'Fecha', 'Categoría', 'Proveedor', 'Descripción', 'Subtotal', 'IVA', 'Retención', 'Total', 'Estado'],
    ];

    const expenseList = Array.isArray(expenses) ? expenses : [];
    for (const exp of expenseList) {
      rows.push([
        exp.expense_number || '',
        exp.expense_date ? new Date(exp.expense_date).toLocaleDateString('es-CO') : '',
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
    rows.push(['', '', '', '', 'TOTALES', totals.subtotal, totals.tax, totals.retention, totals.total, '']);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 14 }, { wch: 14 }, { wch: 18 }, { wch: 25 }, { wch: 35 },
      { wch: 16 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 12 },
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
        'Empleado', 'Cargo', 'Salario Base', 'Días', 'Devengado',
        'Salud Emp', 'Pensión Emp', 'Neto', 'Costo Total Empleador',
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
        'TOTALES', '', totals.base, '', totals.gross,
        totals.health, totals.pension, totals.net, totals.total,
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [
      { wch: 30 }, { wch: 20 }, { wch: 16 }, { wch: 8 }, { wch: 16 },
      { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 20 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Nómina');

    return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
  }
}
