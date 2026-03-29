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
}
