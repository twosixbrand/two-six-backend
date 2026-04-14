import { Module } from '@nestjs/common';
import { ConsignmentReportsService } from './consignment-reports.service';
import { ConsignmentReportsController } from './consignment-reports.controller';

@Module({
  controllers: [ConsignmentReportsController],
  providers: [ConsignmentReportsService],
})
export class ConsignmentReportsModule {}
