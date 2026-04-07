import {
  Controller,
  Get,
} from '@nestjs/common';
import { AgingService } from './aging.service';

@Controller('accounting/reports')
export class AgingController {
  constructor(private readonly agingService: AgingService) {}

  @Get('aging')
  getAgingReport() {
    return this.agingService.getAgingReport();
  }

  @Get('aging/payables')
  getPayablesAging() {
    return this.agingService.getPayablesAging();
  }

  @Get('aging/inventory')
  getInventoryValuation() {
    return this.agingService.getInventoryValuation();
  }
}
