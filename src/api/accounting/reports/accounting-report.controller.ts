import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AccountingReportService } from './accounting-report.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/reports')
export class AccountingReportController {
  constructor(private readonly reportService: AccountingReportService) {}

  @Get('balance-sheet')
  getBalanceSheet(@Query('year') year: string, @Query('month') month: string) {
    return this.reportService.getBalanceSheet(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('income-statement')
  getIncomeStatement(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getIncomeStatement(startDate, endDate);
  }

  @Get('general-ledger')
  getGeneralLedger(
    @Query('account') account: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getGeneralLedger(account, startDate, endDate);
  }

  @Get('subsidiary-ledger')
  getSubsidiaryLedger(
    @Query('account') account: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportService.getSubsidiaryLedger(account, startDate, endDate);
  }

  @Get('balance-sheet/compared')
  getBalanceSheetCompared(
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('compareWith')
    compareWith: 'PREVIOUS_MONTH' | 'PREVIOUS_YEAR' = 'PREVIOUS_YEAR',
  ) {
    return this.reportService.getBalanceSheetCompared(
      parseInt(year, 10),
      parseInt(month, 10),
      compareWith,
    );
  }

  @Get('income-statement/compared')
  getIncomeStatementCompared(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('compareWith')
    compareWith: 'PREVIOUS_PERIOD' | 'PREVIOUS_YEAR' = 'PREVIOUS_YEAR',
  ) {
    return this.reportService.getIncomeStatementCompared(
      startDate,
      endDate,
      compareWith,
    );
  }

  @Get('statement-of-changes-equity')
  getStatementOfChangesInEquity(@Query('year') year: string) {
    return this.reportService.getStatementOfChangesInEquity(parseInt(year, 10));
  }
}
