import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ConsignmentReportsService } from './consignment-reports.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/reports')
@UseGuards(JwtAuthGuard)
export class ConsignmentReportsController {
  constructor(private readonly service: ConsignmentReportsService) {}

  @Get('inventory-by-customer')
  inventoryByCustomer(@Query('id_customer') id_customer?: string) {
    return this.service.inventoryByCustomer(
      id_customer ? Number(id_customer) : undefined,
    );
  }

  @Get('losses')
  losses(@Query('from') from?: string, @Query('to') to?: string) {
    return this.service.lossReport(
      from ? new Date(from) : undefined,
      to ? new Date(to) : undefined,
    );
  }

  @Get('pending-reconciliation')
  pendingReconciliation(@Query('threshold_days') threshold_days?: string) {
    return this.service.pendingReconciliation(
      threshold_days ? Number(threshold_days) : 30,
    );
  }
}
