import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ConsignmentSellReportService, CreateSellReportDto } from './consignment-sell-report.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('consignment/sell-reports')
@UseGuards(JwtAuthGuard)
export class ConsignmentSellReportController {
  constructor(private readonly service: ConsignmentSellReportService) {}

  // ================ Endpoints del CLIENTE (portal web) ================

  /**
   * El cliente ve su stock en consignación (por bodega).
   */
  @Get('my-stock')
  getMyStock(@Request() req: any) {
    const customerId = req.user?.sub;
    if (!customerId) return [];
    return this.service.getClientStock(customerId);
  }

  /**
   * El cliente envía un reporte de venta.
   */
  @Post()
  create(@Request() req: any, @Body() dto: Omit<CreateSellReportDto, 'id_customer'>) {
    const customerId = req.user?.sub;
    return this.service.create({ ...dto, id_customer: customerId } as CreateSellReportDto);
  }

  /**
   * El cliente ve sus reportes.
   */
  @Get('my-reports')
  getMyReports(@Request() req: any) {
    const customerId = req.user?.sub;
    if (!customerId) return [];
    return this.service.findByCustomer(customerId);
  }

  // ================ Endpoints del CMS (operador Two Six) ================

  @Get()
  findAll(@Query('status') status?: string, @Query('id_customer') id_customer?: string) {
    return this.service.findAll({
      status,
      id_customer: id_customer ? Number(id_customer) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Post(':id/reject')
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reason: string; rejected_by?: string },
  ) {
    return this.service.reject(id, body.reason, body.rejected_by || 'Operador CMS');
  }
}
