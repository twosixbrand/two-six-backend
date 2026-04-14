import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import {
  ConsignmentSelloutService,
  PreviewDto,
  ProcessDto,
} from './consignment-sellout.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/sellout')
@UseGuards(JwtAuthGuard)
export class ConsignmentSelloutController {
  constructor(private readonly service: ConsignmentSelloutService) {}

  @Post('preview')
  preview(@Body() dto: PreviewDto) {
    return this.service.preview(dto);
  }

  @Post('process')
  process(@Body() dto: ProcessDto) {
    return this.service.process(dto);
  }
}
