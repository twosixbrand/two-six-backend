import { Body, Controller, Post, Get, HttpCode, HttpStatus, Logger, HttpException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { DianUblService, InvoiceDto } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianCufeService } from './dian-cufe/dian-cufe.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';
import { DianApiKeyGuard } from './dian-api-key.guard';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Dian Facturación Electrónica')
@ApiSecurity('x-api-key')
@UseGuards(DianApiKeyGuard)
@Controller('v1/dian')
export class DianController {
  private readonly logger = new Logger(DianController.name);

  constructor(
    private readonly ublService: DianUblService,
    private readonly signerService: DianSignerService,
    private readonly cufeService: DianCufeService,
    private readonly soapService: DianSoapService,
    private readonly pdfService: DianPdfService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  @Get('invoices')
  @ApiOperation({ summary: 'Listar historial de Facturas Electrónicas DIAN' })
  async getInvoices() {
    return this.prisma.dianEInvoicing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: { order_reference: true }
        }
      }
    });
  }

  @Post('invoice')
  @ApiOperation({ summary: 'Genera y envía una factura electrónica a la DIAN (Consumo API Externa o Interno)' })
  @HttpCode(HttpStatus.OK)
  async createInvoice(@Body() body: any) {
    const invoiceDto: InvoiceDto = {
      number: body.number || `SETT-${Date.now()}`,
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '12:00:00-05:00',
      customerName: body.customerName || 'Cliente Externo API',
      customerDoc: body.customerDoc || '1020304050',
      customerDocType: body.customerDocType || '13',
    };

    try {
      this.logger.log(`Generando Factura Electrónica: ${invoiceDto.number}`);
      
      const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
      const signedXml = this.signerService.signXml(xmlBase);

      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
      const claveTecnica = this.configService.get<string>('DIAN_TECHNICAL_KEY') || 'CLAVE_TECNICA';
      
      const cufe = this.cufeService.generateCufe({
        NumFac: invoiceDto.number, FecFac: invoiceDto.date, HorFac: invoiceDto.time,
        ValFac: '100000.00', CodImp1: '01', ValImp1: '19000.00',
        CodImp2: '', ValImp2: '', CodImp3: '', ValImp3: '',
        ValTot: '119000.00', NitOfe: nit, NumAdq: invoiceDto.customerDoc,
        ClTec: claveTecnica, TipoAmb: '2'
      });

      // El envío SOAP puede tardar, en un entorno de alta carga se delega a una cola
      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), invoiceDto.number);

      const qrBase64 = await this.pdfService.generateQrBase64(
        cufe, nit, '100000.00', '19000.00', '119000.00', invoiceDto.date
      );

      return {
        success: true,
        message: 'Factura procesada con el Motor Core DIAN',
        cufe,
        qrCode: qrBase64,
        dianResponse: soapResponse,
      };
    } catch (error) {
      this.logger.error('Error orquestando Factura DIAN', error);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

