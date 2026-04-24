import { Controller, Get, UseGuards } from '@nestjs/common';
import { AccountingDashboardService } from './accounting-dashboard.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/dashboard')
export class AccountingDashboardController {
  constructor(private readonly dashboardService: AccountingDashboardService) {}

  @Get()
  getDashboard() {
    return this.dashboardService.getDashboard();
  }
}
