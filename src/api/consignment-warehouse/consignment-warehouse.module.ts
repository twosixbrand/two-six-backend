import { Module } from '@nestjs/common';
import { ConsignmentWarehouseService } from './consignment-warehouse.service';
import { ConsignmentWarehouseController } from './consignment-warehouse.controller';

@Module({
  controllers: [ConsignmentWarehouseController],
  providers: [ConsignmentWarehouseService],
  exports: [ConsignmentWarehouseService],
})
export class ConsignmentWarehouseModule {}
