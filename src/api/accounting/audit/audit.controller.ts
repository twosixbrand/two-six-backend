import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';

@Controller('accounting/audit-log')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll({
      entityType,
      startDate,
      endDate,
      limit: limit ? parseInt(limit, 10) : 50,
    });
  }
}
