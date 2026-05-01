import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SystemAuditService } from './system-audit.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('system-audit')
export class SystemAuditController {
  constructor(private readonly systemAuditService: SystemAuditService) {}

  @Get()
  findAll(
    @Query('tableName') tableName?: string,
    @Query('action') action?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.systemAuditService.findAll({
      tableName,
      action,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : 100,
    });
  }
}
