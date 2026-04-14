import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ConsignmentCycleCountService,
  CreateCycleCountDto,
  SaveCycleCountItemsDto,
  CreateMermaInvoiceDto,
} from './consignment-cycle-count.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/cycle-counts')
@UseGuards(JwtAuthGuard)
export class ConsignmentCycleCountController {
  constructor(private readonly service: ConsignmentCycleCountService) {}

  @Post()
  create(@Body() dto: CreateCycleCountDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(
    @Query('id_warehouse') id_warehouse?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll({
      id_warehouse: id_warehouse ? Number(id_warehouse) : undefined,
      status,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/items')
  saveItems(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveCycleCountItemsDto,
  ) {
    return this.service.saveItems(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.service.approve(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id', ParseIntPipe) id: number) {
    return this.service.cancel(id);
  }

  @Post(':id/merma-invoice')
  createMermaInvoice(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateMermaInvoiceDto,
  ) {
    return this.service.createMermaInvoice(id, dto);
  }
}
