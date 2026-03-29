import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { AccountingReportService } from './accounting-report.service';

@Controller('accounting/reports')
export class AccountingReportController {
  constructor(private readonly reportService: AccountingReportService) { }

  @Get('balance-sheet')
  getBalanceSheet(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reportService.getBalanceSheet(parseInt(year, 10), parseInt(month, 10));
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
}
