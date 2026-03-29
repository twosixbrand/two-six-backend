import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { TaxReportService } from './tax-report.service';

@Controller('accounting/tax')
export class TaxReportController {
  constructor(private readonly taxReportService: TaxReportService) {}

  @Get('iva')
  getIvaDeclaration(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.taxReportService.getIvaDeclaration(startDate, endDate);
  }

  @Get('retefuente')
  getReteFuenteDeclaration(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.taxReportService.getReteFuenteDeclaration(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }
}
