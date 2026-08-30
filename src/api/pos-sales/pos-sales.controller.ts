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

  @Post('batch-dian')
  @ApiOperation({
    summary: 'Encolar múltiples ventas POS para envío a la DIAN',
  })
  async queueBatchForDian(@Body() body: { saleIds: number[] }) {
    if (!body.saleIds || !body.saleIds.length) {
      return { message: 'No hay ventas para procesar' };
    }

    // El servicio actualizará el status a QUEUED y devolverá un 202
    return this.posSalesService.queueBatch(body.saleIds);
  }
}
