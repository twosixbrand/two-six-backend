import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Body,
  ParseIntPipe,
  Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { WithholdingService } from './withholding.service';
import { GenerateCertificatesDto } from './dto/generate-certificates.dto';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';


@UseGuards(JwtAuthGuard)
@Controller('accounting/withholding-certificates')
export class WithholdingController {
  constructor(private readonly withholdingService: WithholdingService) {}

  @Get()
  findAll(
    @Query('year') year?: string,
    @Query('provider') provider?: string,
    @Query('concept') concept?: string,
  ) {
    return this.withholdingService.findAll({ year, provider, concept });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.withholdingService.findOne(id);
  }

  @Post('generate')
  generate(@Body() dto: GenerateCertificatesDto) {
    return this.withholdingService.generateFromExpenses(dto.year);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.withholdingService.generatePdf(id);
    const certificate = await this.withholdingService.findOne(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${certificate.certificate_number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.withholdingService.remove(id);
  }
}
