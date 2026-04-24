import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/budget')
export class BudgetController {
  constructor(private readonly budgetService: BudgetService) {}

  @Get()
  findAll(@Query('year') year: string) {
    return this.budgetService.findAll(parseInt(year, 10));
  }

  @Post()
  upsert(
    @Body()
    body: {
      year: number;
      month: number;
      id_puc_account: number;
      budgeted_amount: number;
      notes?: string;
    },
  ) {
    return this.budgetService.upsert(
      body.year,
      body.month,
      body.id_puc_account,
      body.budgeted_amount,
      body.notes,
    );
  }

  @Get('comparison')
  getComparison(@Query('year') year: string, @Query('month') month: string) {
    return this.budgetService.getComparison(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('comparison/annual')
  getAnnualComparison(@Query('year') year: string) {
    return this.budgetService.getAnnualComparison(parseInt(year, 10));
  }
}
