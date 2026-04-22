import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@Controller('accounting/alerts')
@UseGuards(JwtAuthGuard)
export class AlertsController {
  constructor(private readonly service: AlertsService) {}

  @Get()
  findAll(
    @Query('draftDays') draftDays?: string,
    @Query('idleMonths') idleMonths?: string,
  ) {
    return this.service.getAll({
      draftDays: draftDays ? parseInt(draftDays, 10) : undefined,
      idleMonths: idleMonths ? parseInt(idleMonths, 10) : undefined,
    });
  }
}
