import { Module } from '@nestjs/common';
import { ConsignmentDispatchService } from './consignment-dispatch.service';
import { ConsignmentDispatchController } from './consignment-dispatch.controller';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [AccountingModule],
  controllers: [ConsignmentDispatchController],
  providers: [ConsignmentDispatchService],
  exports: [ConsignmentDispatchService],
})
export class ConsignmentDispatchModule {}
