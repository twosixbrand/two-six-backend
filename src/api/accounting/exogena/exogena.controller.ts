import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExogenaService } from './exogena.service';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('accounting/exogena')
export class ExogenaController {
  constructor(private readonly exogenaService: ExogenaService) {}

  @Get('preview')
  async preview(@Query('year') year: string) {
    return this.exogenaService.preview(parseInt(year, 10));
  }

  @Get('export')
  async export(@Query('year') year: string, @Res() res: Response) {
    const buffer = await this.exogenaService.generateExcel(parseInt(year, 10));
    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="Exogena_${year}.xlsx"`,
    });
    res.send(buffer);
  }

  @Get('movements')
  async getThirdPartyMovements(
    @Query('year') year: string,
    @Query('nit') nit: string,
  ) {
    return this.exogenaService.getThirdPartyMovements(parseInt(year, 10), nit);
  }
}
