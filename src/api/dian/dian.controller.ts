import { Body, Controller, Post, Get, Param, Res, HttpCode, HttpStatus, Logger, HttpException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
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

  @Get('status/:trackId')
  @ApiOperation({ summary: 'Consultar estado de un documento en la DIAN por ZipKey/TrackId' })
  async getStatus(@Param('trackId') trackId: string) {
    try {
      const rawResponse = await this.soapService.getStatusZip(trackId);

      // Extraer los campos relevantes de la respuesta SOAP
      const statusCode = rawResponse.match(/<b:StatusCode>(.*?)<\/b:StatusCode>/)?.[1];
      const statusDescription = rawResponse.match(/<b:StatusDescription>(.*?)<\/b:StatusDescription>/)?.[1];
      const statusMessage = rawResponse.match(/<b:StatusMessage>(.*?)<\/b:StatusMessage>/s)?.[1];
      const isValid = rawResponse.match(/<b:IsValid>(.*?)<\/b:IsValid>/)?.[1];
      const errorMessages = rawResponse.match(/<b:ErrorMessage>(.*?)<\/b:ErrorMessage>/s)?.[1];

      // Extraer lista de errores de validación si existen
      const processedMessages: string[] = [];
      const msgRegex = /<c:ProcessedMessage>(.*?)<\/c:ProcessedMessage>/g;
      let match;
      while ((match = msgRegex.exec(rawResponse)) !== null) {
        processedMessages.push(match[1]);
      }

      return {
        trackId,
        statusCode: statusCode || 'UNKNOWN',
        statusDescription: statusDescription || '',
        statusMessage: statusMessage || '',
        isValid: isValid || 'false',
        errorMessages: errorMessages || '',
        validationMessages: processedMessages,
        rawResponse,
      };
    } catch (error) {
      this.logger.error('Error consultando estado DIAN:', error.message);
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('invoices/:id/qr.png')
  @ApiOperation({ summary: 'Imagen QR de la factura (para emails)' })
  async getQrImage(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.prisma.dianEInvoicing.findUnique({ where: { id: Number(id) } });
    if (!invoice) throw new HttpException('Factura no encontrada', HttpStatus.NOT_FOUND);

    const QRCode = require('qrcode');
    const url = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${invoice.cufe_code}`;
    const pngBuffer = await QRCode.toBuffer(url, { width: 200, margin: 2, errorCorrectionLevel: 'M' });

    res.set({ 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' });
    res.send(pngBuffer);
  }

  @Get('invoices/:id/xml')
  @ApiOperation({ summary: 'Descargar XML de una factura electrónica' })
  async downloadXml(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.prisma.dianEInvoicing.findUnique({ where: { id: Number(id) } });
    if (!invoice) throw new HttpException('Factura no encontrada', HttpStatus.NOT_FOUND);

    // Regenerar el XML firmado con CUFE real
    const invoiceDto: any = {
      number: invoice.document_number,
      date: invoice.issue_date.toISOString().split('T')[0],
      time: '12:00:00-05:00',
      customerName: 'Cliente',
      customerDoc: '1020304050',
      customerDocType: '13',
    };

    const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
    const xmlWithCufe = xmlBase.replace('CUFE_PLACEHOLDER', invoice.cufe_code || '');
    const signedXml = this.signerService.signXml(xmlWithCufe);

    res.set({
      'Content-Type': 'application/xml',
      'Content-Disposition': `attachment; filename="${invoice.document_number}.xml"`,
    });
    res.send(signedXml);
  }

  @Get('invoices/:id/pdf')
  @ApiOperation({ summary: 'Descargar PDF de representación gráfica' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const invoice = await this.prisma.dianEInvoicing.findUnique({
      where: { id: Number(id) },
      include: {
        order: {
          include: {
            customer: true,
            orderItems: true,
          },
        },
      },
    });
    if (!invoice) throw new HttpException('Factura no encontrada', HttpStatus.NOT_FOUND);

    const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.configService.get<string>('DIAN_COMPANY_DV') || '';
    const companyName = this.configService.get<string>('DIAN_COMPANY_NAME') || 'TWO SIX S.A.S.';

    const order = invoice.order;
    const items = order?.orderItems || [];
    const customer = order?.customer;

    const subtotal = items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
    const iva = order?.iva || 0;
    const shipping = order?.shipping_cost || 0;
    const total = order?.total_payment || subtotal + iva + shipping;

    const formatCOP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

    const itemsHtml = items.length > 0
      ? items.map((item, i) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${i + 1}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;">${item.product_name}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.size} / ${item.color}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCOP(item.unit_price)}</td>
          <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">${formatCOP(item.unit_price * item.quantity)}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" style="padding:12px;text-align:center;color:#999;">Factura generada sin detalle de productos (prueba API)</td></tr>';

    // Regenerar QR con URL limpia si el actual no funciona
    const qrUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${invoice.cufe_code}`;
    let qrImg = invoice.qr_code;
    if (!qrImg || !qrImg.startsWith('data:image')) {
      qrImg = await this.pdfService.generateQrBase64(invoice.cufe_code || '', nit, '0', '0', '0', '');
    }

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura ${invoice.document_number}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, sans-serif; margin: 0; padding: 30px; font-size: 12px; color: #333; }
  .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 20px; }
  .header h1 { margin: 0; font-size: 22px; letter-spacing: 3px; }
  .header h2 { margin: 4px 0; font-size: 13px; color: #555; font-weight: normal; }
  .header p { margin: 2px 0; font-size: 11px; }
  .grid { display: flex; gap: 15px; margin-bottom: 15px; }
  .grid > div { flex: 1; border: 1px solid #ddd; padding: 10px; border-radius: 4px; }
  .grid h3 { margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; color: #555; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  .grid p { margin: 2px 0; font-size: 11px; }
  .bold { font-weight: bold; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  thead th { background: #f5f5f5; padding: 8px; text-align: left; font-size: 11px; border-bottom: 2px solid #ddd; }
  .totals { margin-top: 10px; }
  .totals tr td { padding: 4px 8px; font-size: 12px; }
  .totals .total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #333; padding-top: 8px; }
  .cufe { word-break: break-all; font-size: 9px; background: #f9f9f9; padding: 8px; border: 1px solid #eee; border-radius: 4px; margin-top: 15px; }
  .qr-section { text-align: center; margin-top: 15px; }
  .qr-section img { width: 140px; height: 140px; }
  .qr-section p { font-size: 10px; color: #666; margin-top: 4px; }
  .footer { margin-top: 25px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
  @media print { body { padding: 15px; } }
</style></head><body>
  <div class="header">
    <h1>${companyName}</h1>
    <h2>FACTURA ELECTRÓNICA DE VENTA</h2>
    <p>NIT: ${nit}-${dv} | Régimen Común</p>
  </div>

  <div class="grid">
    <div>
      <h3>Factura</h3>
      <p><span class="bold">Número:</span> ${invoice.document_number}</p>
      <p><span class="bold">Fecha:</span> ${invoice.issue_date.toLocaleDateString('es-CO')}</p>
      <p><span class="bold">Estado:</span> ${invoice.status}</p>
      <p><span class="bold">Ambiente:</span> ${invoice.environment}</p>
      ${order ? `<p><span class="bold">Pedido:</span> ${order.order_reference}</p>` : ''}
    </div>
    <div>
      <h3>Cliente</h3>
      ${customer ? `
        <p><span class="bold">Nombre:</span> ${customer.name}</p>
        <p><span class="bold">Email:</span> ${customer.email}</p>
        <p><span class="bold">Teléfono:</span> ${customer.current_phone_number}</p>
        <p><span class="bold">Dirección:</span> ${order?.shipping_address || customer.shipping_address}</p>
      ` : '<p>Cliente no especificado</p>'}
    </div>
    <div>
      <h3>Emisor</h3>
      <p><span class="bold">Razón Social:</span> ${companyName}</p>
      <p><span class="bold">NIT:</span> ${nit}-${dv}</p>
    </div>
  </div>

  <h3 style="margin-bottom:0;font-size:13px;">Detalle de Productos</h3>
  <table>
    <thead>
      <tr>
        <th style="width:30px;">#</th>
        <th>Producto</th>
        <th style="text-align:center;">Talla / Color</th>
        <th style="text-align:center;width:50px;">Cant.</th>
        <th style="text-align:right;">P. Unitario</th>
        <th style="text-align:right;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <table class="totals" style="width:300px;margin-left:auto;">
    <tr>
      <td style="text-align:right;">Subtotal:</td>
      <td style="text-align:right;">${formatCOP(subtotal)}</td>
    </tr>
    ${iva > 0 ? `<tr><td style="text-align:right;">IVA:</td><td style="text-align:right;">${formatCOP(iva)}</td></tr>` : ''}
    ${shipping > 0 ? `<tr><td style="text-align:right;">Envío:</td><td style="text-align:right;">${formatCOP(shipping)}</td></tr>` : ''}
    <tr class="total-row">
      <td style="text-align:right;">TOTAL:</td>
      <td style="text-align:right;">${formatCOP(total)}</td>
    </tr>
  </table>

  <div class="cufe">
    <span class="bold">CUFE:</span> ${invoice.cufe_code || 'N/A'}
  </div>

  ${qrImg ? `
  <div class="qr-section">
    <img src="${qrImg}" alt="QR DIAN"/>
    <p>Consulte esta factura en:<br><a href="${qrUrl}">${qrUrl}</a></p>
  </div>` : ''}

  <div class="footer">
    <p>Representación gráfica de factura electrónica - ${companyName}</p>
    <p>Documento generado por el sistema Two Six &copy; ${new Date().getFullYear()}</p>
  </div>
</body></html>`;

    res.set({
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="${invoice.document_number}.html"`,
    });
    res.send(html);
  }

  @Post('invoice')
  @ApiOperation({ summary: 'Genera y envía una factura electrónica a la DIAN (Consumo API Externa o Interno)' })
  @HttpCode(HttpStatus.OK)
  async createInvoice(@Body() body: any) {
    try {
      const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');

      // Obtener siguiente número consecutivo de la resolución activa
      const resolution = await this.prisma.dianResolution.findFirst({
        where: { isActive: true, environment: env, type: 'INVOICE' },
      });
      if (!resolution) throw new Error('No hay resolución DIAN activa configurada');
      if (resolution.currentNumber >= resolution.endNumber) throw new Error('Se agotó el rango de numeración DIAN');

      const nextNumber = resolution.currentNumber + 1;
      await this.prisma.dianResolution.update({
        where: { id: resolution.id },
        data: { currentNumber: nextNumber },
      });

      const invoiceNumber = `${resolution.prefix}${nextNumber}`;

      const invoiceDto: InvoiceDto = {
        number: invoiceNumber,
        date: body.date || new Date().toISOString().split('T')[0],
        time: body.time || '12:00:00-05:00',
        customerName: body.customerName || 'Cliente Externo API',
        customerDoc: body.customerDoc || '1020304050',
        customerDocType: body.customerDocType || '13',
      };

      this.logger.log(`Generando Factura Electrónica: ${invoiceDto.number}`);

      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
      const claveTecnica = resolution.technicalKey || this.configService.get<string>('DIAN_TECHNICAL_KEY') || '';

      // 1. Generar CUFE primero
      const cufe = this.cufeService.generateCufe({
        NumFac: invoiceDto.number, FecFac: invoiceDto.date, HorFac: invoiceDto.time,
        ValFac: '100000.00', CodImp1: '01', ValImp1: '19000.00',
        CodImp2: '', ValImp2: '', CodImp3: '', ValImp3: '',
        ValTot: '119000.00', NitOfe: nit, NumAdq: invoiceDto.customerDoc,
        ClTec: claveTecnica, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      // 2. Generar XML con CUFE insertado, luego firmar
      const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
      const xmlWithCufe = xmlBase.replace('CUFE_PLACEHOLDER', cufe);
      const signedXml = this.signerService.signXml(xmlWithCufe);

      // 3. Enviar a DIAN
      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), invoiceDto.number);

      const qrBase64 = await this.pdfService.generateQrBase64(
        cufe, nit, '100000.00', '19000.00', '119000.00', invoiceDto.date
      );

      // Persistir en base de datos
      const saved = await this.prisma.dianEInvoicing.create({
        data: {
          document_number: invoiceDto.number,
          cufe_code: cufe,
          qr_code: qrBase64,
          issue_date: new Date(invoiceDto.date),
          due_date: new Date(invoiceDto.date),
          status: 'SENT',
          dian_response: typeof soapResponse === 'string' ? soapResponse : JSON.stringify(soapResponse),
          environment: env,
          ...(body.orderId ? { id_order: body.orderId } : {}),
        },
      });

      this.logger.log(`Factura ${invoiceDto.number} guardada con id: ${saved.id}`);

      return {
        success: true,
        message: 'Factura procesada con el Motor Core DIAN',
        invoiceId: saved.id,
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

