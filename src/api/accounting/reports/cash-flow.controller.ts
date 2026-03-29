import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';

@Controller('accounting/reports')
export class CashFlowController {
  constructor(private readonly cashFlowService: CashFlowService) {}

  @Get('cash-flow')
  getCashFlow(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.cashFlowService.getCashFlow(startDate, endDate);
  }
}
