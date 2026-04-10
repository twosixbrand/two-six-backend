import {
  Controller,
  Get,
  Query, UseGuards } from '@nestjs/common';
import { CashFlowService } from './cash-flow.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
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
