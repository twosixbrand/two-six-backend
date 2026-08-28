import { Module } from '@nestjs/common';
import { PosSalesController } from './pos-sales.controller';
import { PosSalesService } from './pos-sales.service';

@Module({
  controllers: [PosSalesController],
  providers: [PosSalesService],
})
export class PosSalesModule {}
