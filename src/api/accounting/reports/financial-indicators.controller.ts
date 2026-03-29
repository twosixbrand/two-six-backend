import {
  Controller,
  Get,
  Query,
} from '@nestjs/common';
import { FinancialIndicatorsService } from './financial-indicators.service';

@Controller('accounting/reports')
export class FinancialIndicatorsController {
  constructor(private readonly indicatorsService: FinancialIndicatorsService) { }

  @Get('indicators')
  getIndicators(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.indicatorsService.getIndicators(parseInt(year, 10), parseInt(month, 10));
  }
}
