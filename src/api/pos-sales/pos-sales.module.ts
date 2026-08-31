import { Module } from '@nestjs/common';
import { PosSalesController } from './pos-sales.controller';
import { PosSalesService } from './pos-sales.service';
import { PosSalesCronService } from './pos-sales-cron.service';
import { DianModule } from '../dian/dian.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [DianModule, AccountingModule],
  controllers: [PosSalesController],
  providers: [PosSalesService, PosSalesCronService],
})
export class PosSalesModule {}
