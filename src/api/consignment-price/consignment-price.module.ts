import { Module } from '@nestjs/common';
import { ConsignmentPriceService } from './consignment-price.service';
import { ConsignmentPriceController } from './consignment-price.controller';

@Module({
  controllers: [ConsignmentPriceController],
  providers: [ConsignmentPriceService],
  exports: [ConsignmentPriceService],
})
export class ConsignmentPriceModule {}
