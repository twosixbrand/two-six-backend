import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ProfitabilityService } from './profitability.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@ApiTags('accounting/reports')
@UseGuards(JwtAuthGuard)
@Controller('accounting/reports/profitability')
export class ProfitabilityController {
  constructor(private readonly profitabilityService: ProfitabilityService) {}

  @Get('design')
  @ApiOperation({ summary: 'Obtener rentabilidad real detallada por diseño' })
  getByDesign(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.profitabilityService.getProfitabilityByDesign(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('collection')
  @ApiOperation({
    summary: 'Obtener rentabilidad real consolidada por colección',
  })
  getByCollection(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.profitabilityService.getProfitabilityByCollection(
      new Date(startDate),
      new Date(endDate),
    );
  }
}
