import { Module } from '@nestjs/common';
import { ConsignmentReturnService } from './consignment-return.service';
import { ConsignmentReturnController } from './consignment-return.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [ConsignmentReturnController],
  providers: [ConsignmentReturnService],
  exports: [ConsignmentReturnService],
})
export class ConsignmentReturnModule {}
