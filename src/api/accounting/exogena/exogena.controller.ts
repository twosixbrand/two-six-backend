import {
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ExogenaService } from './exogena.service';

@Controller('accounting/exogena')
export class ExogenaController {
  constructor(private readonly exogenaService: ExogenaService) {}

  @Get('preview')
  async preview(@Query('year') year: string) {
    return this.exogenaService.preview(parseInt(year, 10));
  }

  @Get('generate')
  async generate(
    @Query('year') year: string,
    @Res() res: Response,
  ) {
    const buffer = await this.exogenaService.generateExcel(parseInt(year, 10));
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="InformacionExogena_${year}.xlsx"`,
    });
    res.send(buffer);
  }
}
