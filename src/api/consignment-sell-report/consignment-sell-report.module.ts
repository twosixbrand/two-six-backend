import { Module } from '@nestjs/common';
import { ConsignmentSellReportService } from './consignment-sell-report.service';
import { ConsignmentSellReportController } from './consignment-sell-report.controller';

@Module({
  controllers: [ConsignmentSellReportController],
  providers: [ConsignmentSellReportService],
  exports: [ConsignmentSellReportService],
})
export class ConsignmentSellReportModule {}
