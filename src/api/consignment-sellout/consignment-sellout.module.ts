import { Module } from '@nestjs/common';
import { ConsignmentSelloutService } from './consignment-sellout.service';
import { ConsignmentSelloutController } from './consignment-sellout.controller';
import { ConsignmentPriceModule } from '../consignment-price/consignment-price.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [ConsignmentPriceModule, AccountingModule],
  controllers: [ConsignmentSelloutController],
  providers: [ConsignmentSelloutService],
})
export class ConsignmentSelloutModule {}
