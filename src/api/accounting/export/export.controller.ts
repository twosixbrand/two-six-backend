import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from './export.service';

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
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const buffer = await this.exportService.generateIncomeStatement(startDate, endDate);
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const buffer = await this.exportService.generateGeneralLedger(account, startDate, endDate);
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const buffer = await this.exportService.generateJournalEntries(startDate, endDate);
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
    const buffer = await this.exportService.generateExpenses(startDate, endDate);
    const date = `${startDate}_${endDate}`;
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Gastos_${date}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('payroll')
  async exportPayroll(
    @Query('periodId') periodId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exportService.generatePayroll(parseInt(periodId, 10));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Nomina_Periodo_${periodId}.xlsx"`,
    });
    res.send(buffer);
  }
}
