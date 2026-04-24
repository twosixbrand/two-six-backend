import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { TaxReportService } from './tax-report.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/tax')
export class TaxReportController {
  constructor(private readonly taxReportService: TaxReportService) {}

  @Get('iva')
  getIvaDeclaration(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.taxReportService.getIvaDeclaration(startDate, endDate);
  }

  /**
   * Exporta la declaración de IVA (Formulario 300) como CSV descargable.
   */
  @Get('iva/export')
  async exportIvaCsv(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Res() res: Response,
  ) {
    const file = await this.taxReportService.exportIvaDeclarationCsv(
      startDate,
      endDate,
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.filename}"`,
    );
    res.send(file.content);
  }

  @Get('retefuente')
  getReteFuenteDeclaration(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.taxReportService.getReteFuenteDeclaration(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }
}
