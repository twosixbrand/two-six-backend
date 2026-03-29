import { Controller, Get } from '@nestjs/common';
import { AccountingDashboardService } from './accounting-dashboard.service';

@Controller('accounting/dashboard')
export class AccountingDashboardController {
  constructor(
    private readonly dashboardService: AccountingDashboardService,
  ) {}

  @Get()
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
