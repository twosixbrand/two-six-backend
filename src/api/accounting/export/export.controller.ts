import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/export')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get('balance-sheet')
  async exportBalanceSheet(
    @Query('year') year: string,
    @Query('month') month: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateBalanceSheet(
      parseInt(year, 10),
      parseInt(month, 10),
    );
    const date = `${year}-${month.padStart(2, '0')}`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="BalanceGeneral_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('income-statement')
  async exportIncomeStatement(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateIncomeStatement(
      startDate,
      endDate,
    );
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="EstadoResultados_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('general-ledger')
  async exportGeneralLedger(
    @Query('account') account: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateGeneralLedger(
      account,
      startDate,
      endDate,
    );
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="LibroMayor_${account}_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('journal-entries')
  async exportJournalEntries(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateJournalEntries(
      startDate,
      endDate,
    );
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="AsientosContables_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('expenses')
  async exportExpenses(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateExpenses(
      startDate,
      endDate,
    );
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Gastos_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('payroll')
  async exportPayroll(
    @Query('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generatePayroll(
      parseInt(periodId, 10),
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Nomina_Periodo_${periodId}.xlsx"`,
    });
    res.send(buffer);
  }

  // ── Aging Reports Excel Exports ───────────────────────────────

  @Get('aging-receivables')
  async exportReceivablesAging(@Res() res: Response) {
    const buffer = await this.exportService.generateReceivablesAging();
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="CxC_Cartera_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('aging-payables')
  async exportPayablesAging(@Res() res: Response) {
    const buffer = await this.exportService.generatePayablesAging();
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="CxP_Cartera_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('inventory-valuation')
  async exportInventoryValuation(@Res() res: Response) {
    const buffer = await this.exportService.generateInventoryValuation();
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Inventario_Valoracion_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('budget-comparison')
  async exportBudgetComparison(
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateAnnualBudgetComparison(
      parseInt(year, 10),
    );
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="ComparativoPresupuesto_${year}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('kardex')
  async exportKardex(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('type') type: string,
    @Query('sourceType') sourceType: string,
    @Query('search') search: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generateKardex({
      startDate,
      endDate,
      type,
      sourceType,
      search,
    });
    const date = new Date().toISOString().split('T')[0];
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Kardex_Inventario_${date}.xlsx"`,
    });
    res.send(buffer);
  }
}
