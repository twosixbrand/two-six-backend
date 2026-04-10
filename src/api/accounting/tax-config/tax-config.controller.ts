import { Controller, Get, Post, Body, Param, Delete, ParseIntPipe , UseGuards } from '@nestjs/common';
import { TaxConfigService } from './tax-config.service';
import { CreateTaxConfigDto } from './dto/create-tax-config.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';


@ApiTags('accounting/tax-config')
@UseGuards(JwtAuthGuard)
@Controller('accounting/tax-config')
export class TaxConfigController {
  constructor(private readonly taxConfigService: TaxConfigService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una nueva configuración de impuesto' })
  create(@Body() createTaxConfigDto: CreateTaxConfigDto) {
    return this.taxConfigService.create(createTaxConfigDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las configuraciones de impuestos' })
  findAll() {
    return this.taxConfigService.findAll();
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar una configuración de impuesto' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.taxConfigService.remove(id);
  }
}
