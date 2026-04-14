import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('accounting/reconciliation')
@UseGuards(JwtAuthGuard)
export class ReconciliationController {
  constructor(private readonly service: ReconciliationService) {}

  @Get('mayor-auxiliar')
  mayorAuxiliar(@Query('endDate') endDate?: string) {
    return this.service.mayorVsAuxiliar({ endDate });
  }
}
