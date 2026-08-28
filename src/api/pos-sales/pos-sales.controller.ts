import { Controller, Post, Get, Body } from '@nestjs/common';
import { PosSalesService } from './pos-sales.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Ventas POS Ferias')
@Controller('v1/pos-sales')
export class PosSalesController {
  constructor(private readonly posSalesService: PosSalesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear venta POS borrador' })
  async create(@Body() body: any) {
    return this.posSalesService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Listar ventas POS borrador y facturadas' })
  async findAll() {
    return this.posSalesService.findAll();
  }
}
