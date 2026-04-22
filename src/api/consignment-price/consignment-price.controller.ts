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
  ConsignmentPriceService,
  CreatePriceDto,
  UpdatePriceDto,
  BulkCreatePriceDto,
} from './consignment-price.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/prices')
export class ConsignmentPriceController {
  constructor(private readonly service: ConsignmentPriceService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreatePriceDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  bulkCreate(@Body() dto: BulkCreatePriceDto) {
    return this.service.bulkCreate(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('id_customer') id_customer?: string,
    @Query('id_product') id_product?: string,
    @Query('only_active') only_active?: string,
  ) {
    return this.service.findAll({
      id_customer: id_customer ? Number(id_customer) : undefined,
      id_product: id_product ? Number(id_product) : undefined,
      only_active: only_active === 'true',
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePriceDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
