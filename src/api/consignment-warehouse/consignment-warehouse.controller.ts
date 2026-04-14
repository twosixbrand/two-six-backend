import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ConsignmentWarehouseService,
  CreateWarehouseDto,
  UpdateWarehouseDto,
} from './consignment-warehouse.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/warehouses')
export class ConsignmentWarehouseController {
  constructor(private readonly service: ConsignmentWarehouseService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateWarehouseDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query('id_customer') id_customer?: string) {
    return this.service.findAll(id_customer ? Number(id_customer) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stock')
  findStock(@Param('id', ParseIntPipe) id: number) {
    return this.service.findStockByWarehouse(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateWarehouseDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
