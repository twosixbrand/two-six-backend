import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe, UseGuards } from '@nestjs/common';
import { DepreciationService } from './depreciation.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('accounting/assets')
export class DepreciationController {
  constructor(private readonly depreciationService: DepreciationService) { }

  @Get()
  findAll() {
    return this.depreciationService.findAll();
  }

  @Post()
  create(
    @Body() body: {
      name: string;
      description?: string;
      acquisition_date: string;
      acquisition_cost: number;
      useful_life_months: number;
      salvage_value?: number;
      depreciation_method?: string;
      id_puc_asset: number;
      id_puc_depreciation: number;
      id_puc_accumulated: number;
    },
  ) {
    return this.depreciationService.create(body);
  }

  @Post('depreciate')
  runMonthlyDepreciation(
    @Body() body: { year: number; month: number },
  ) {
    return this.depreciationService.runMonthlyDepreciation(body.year, body.month);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.depreciationService.findOne(id);
  }
}
