import { Module } from '@nestjs/common';
import { SystemAuditController } from './system-audit.controller';
import { SystemAuditService } from './system-audit.service';
import { SystemAuditCronService } from './system-audit-cron.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemAuditController],
  providers: [SystemAuditService, SystemAuditCronService],
})
export class SystemAuditModule {}
