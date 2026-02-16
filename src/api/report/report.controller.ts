import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { GetGeneralSalesReportDto } from './dto/get-general-sales-report.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
    constructor(private readonly reportService: ReportService) { }

    @Get('sales/general')
    @ApiOperation({ summary: 'Obtener reporte general de ventas' })
    @ApiResponse({ status: 200, description: 'Reporte generado exitosamente.' })
    getGeneralSalesReport(@Query() dto: GetGeneralSalesReportDto) {
        return this.reportService.getGeneralSalesReport(dto);
    }
}
