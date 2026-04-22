import { Module } from '@nestjs/common';
import { ConsignmentCycleCountService } from './consignment-cycle-count.service';
import { ConsignmentCycleCountController } from './consignment-cycle-count.controller';
import { ConsignmentPriceModule } from '../consignment-price/consignment-price.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [ConsignmentPriceModule, AccountingModule],
  controllers: [ConsignmentCycleCountController],
  providers: [ConsignmentCycleCountService],
})
export class ConsignmentCycleCountModule {}
