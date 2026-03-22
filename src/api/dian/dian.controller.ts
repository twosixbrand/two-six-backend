import { Body, Controller, Post, Get, Param, Res, HttpCode, HttpStatus, Logger, HttpException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiSecurity } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

import { DianUblService, InvoiceDto, NoteDto } from './dian-ubl/dian-ubl.service';
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
      const xmlBase64Bytes = rawResponse.match(/<b:XmlBase64Bytes>(.*?)<\/b:XmlBase64Bytes>/s)?.[1];

      // Extraer lista de errores de validación si existen
      const processedMessages: string[] = [];
      const msgRegex = /<c:ProcessedMessage>(.*?)<\/c:ProcessedMessage>/g;
      let match;
      while ((match = msgRegex.exec(rawResponse)) !== null) {
        processedMessages.push(match[1]);
      }

      let finalStatus = 'SENT';
      if (isValid === 'true' && statusCode === '00') {
        finalStatus = 'AUTHORIZED';
      } else if (isValid === 'false' && statusCode === '2') {
        finalStatus = 'AUTHORIZED';
      } else if (isValid === 'false' && statusCode === '99') {
        finalStatus = 'ERROR';
      } else if (isValid === 'false' && parseInt(statusCode || '0', 10) >= 60) {
        finalStatus = 'REJECTED';
      }

      const invoice = await this.prisma.dianEInvoicing.findFirst({
        where: { dian_response: { contains: trackId } }
      });
      if (invoice) {
        const dataToUpdate: any = {};
        if (invoice.status !== finalStatus && finalStatus !== 'SENT') {
          dataToUpdate.status = finalStatus;
        }
        if (xmlBase64Bytes && invoice.dian_zip_base64 !== xmlBase64Bytes) {
          dataToUpdate.dian_zip_base64 = xmlBase64Bytes;
        }

        if (Object.keys(dataToUpdate).length > 0) {
          await this.prisma.dianEInvoicing.update({
            where: { id: invoice.id },
            data: dataToUpdate
          });
        }
      }

      return {
        trackId,
        statusCode: statusCode || 'UNKNOWN',
        statusDescription: statusDescription || '',
        statusMessage: statusMessage || '',
        isValid: isValid || 'false',
        errorMessages: errorMessages || '',
        validationMessages: processedMessages,
        hasXmlResponse: !!xmlBase64Bytes,
        rawResponse,
      };
    } catch (error) {
      this.logger.error('Error consultando estado DIAN:', error.message);
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('status/:trackId/xml')
  @ApiOperation({ summary: 'Descargar ApplicationResponse XML de DIAN' })
  async getStatusXml(@Param('trackId') trackId: string, @Res() res: Response) {
    try {
      const rawResponse = await this.soapService.getStatusZip(trackId);
      const xmlBase64Bytes = rawResponse.match(/<b:XmlBase64Bytes>(.*?)<\/b:XmlBase64Bytes>/s)?.[1];
      
      if (!xmlBase64Bytes) {
        throw new HttpException('La respuesta de la DIAN no contiene XmlBase64Bytes', HttpStatus.NOT_FOUND);
      }

      const xmlBuffer = Buffer.from(xmlBase64Bytes, 'base64');
      
      // La DIAN a veces puede empacar ApplicationResponse adentro de un ZIP en el XmlBase64Bytes.
      // (En la gran mayoría de casos de Validación es un XML Directo (AttachedDocument / ApplicationResponse).
      // Le ponemos descarga ApplicationResponse.xml 
      // Si el buffer empieza con "PK.." entonces es un ZIP.
      if (xmlBuffer.slice(0, 4).toString() === 'PK\x03\x04') {
        res.set({
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="ApplicationResponse_${trackId}.zip"`,
        });
      } else {
        res.set({
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="ApplicationResponse_${trackId}.xml"`,
        });
      }

      res.send(xmlBuffer);
    } catch (error) {
      this.logger.error('Error descargando XML DIAN:', error.message);
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
    const resolution = await this.prisma.dianResolution.findFirst({
      where: { id: invoice.id_dian_resolution || 0 },
    }) || await this.prisma.dianResolution.findFirst({
      where: { isActive: true, environment: invoice.environment as any, type: 'INVOICE' },
    });

    const invoiceDto: InvoiceDto = {
      number: invoice.document_number,
      date: invoice.issue_date.toISOString().split('T')[0],
      time: '12:00:00-05:00',
      customerName: 'Cliente',
      customerDoc: '222222222222',
      customerDocType: '13',
      // Resolution data
      resolutionPrefix: resolution?.prefix,
      resolutionNumber: resolution?.resolutionNumber,
      resolutionStartDate: resolution?.startDate.toISOString().split('T')[0],
      resolutionEndDate: resolution?.endDate.toISOString().split('T')[0],
      resolutionStartNumber: resolution?.startNumber,
      resolutionEndNumber: resolution?.endNumber,
    };

    const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
    const xmlWithCufe = xmlBase.replace(/CUFE_PLACEHOLDER/g, invoice.cufe_code || '');
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
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${item.id_product || i + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${item.product_name} ${item.size ? '- Talla '+item.size : ''}</td>
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${item.quantity}</td>
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">94</td>
          <td class="text-right" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${formatCOP(item.unit_price)}</td>
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${order?.iva && order.iva > 0 ? '19%' : '0%'}</td>
          <td class="text-right" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${formatCOP(order?.iva && order.iva > 0 ? item.unit_price * 0.19 : 0)}</td>
          <td class="text-right" style="padding: 8px; border-bottom: 1px solid #eee;">${formatCOP(item.unit_price * item.quantity)}</td>
        </tr>`).join('')
      : '<tr><td colspan="8" class="text-center" style="padding: 8px; color: #888;">Factura generada sin detalle de productos (prueba API)</td></tr>';

    // Regenerar QR con URL limpia si el actual no funciona
    const qrUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${invoice.cufe_code}`;
    let qrImg = invoice.qr_code;
    if (!qrImg || !qrImg.startsWith('data:image')) {
      qrImg = await this.pdfService.generateQrBase64(invoice.cufe_code || '', nit, '0', '0', '0', '');
    }

    const fsNative = require('fs');
    const pathNative = require('path');
    const logoPath = pathNative.join(process.cwd(), '../two-six-web/public/logo-black.png');
    let logoBase64 = '';
    if (fsNative.existsSync(logoPath)) {
      logoBase64 = 'data:image/png;base64,' + fsNative.readFileSync(logoPath).toString('base64');
    }

    const resolution = await this.prisma.dianResolution.findFirst({
      where: { isActive: true, environment: invoice.environment, type: 'INVOICE' }
    });
    const resText = resolution 
      ? `Facturación Electrónica, según resolución de la DIAN No. ${resolution.resolutionNumber} con vigencia del ${resolution.startDate?.toISOString().split('T')[0]} al ${resolution.endDate?.toISOString().split('T')[0]}. Numeración habilitada del ${resolution.prefix}${resolution.startNumber} a ${resolution.prefix}${resolution.endNumber}` 
      : 'Resolución DIAN no configurada';

    const validationDate = invoice.updatedAt ? invoice.updatedAt.toLocaleString('es-CO') : invoice.issue_date.toLocaleString('es-CO');

    const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Factura ${invoice.document_number}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; font-size: 10px; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
  .header-left .brand { display: flex; align-items: center; gap: 15px; margin-bottom: 8px; }
  .header-left img { max-height: 55px; }
  .header-left h1 { margin: 0; font-size: 16px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; color: #000; }
  .header-left p { margin: 2px 0; font-size: 9px; color: #444; }
  .header-right { text-align: right; }
  .header-right h2 { margin: 0; font-size: 16px; font-weight: 700; color: #000; }
  .header-right p { margin: 4px 0 0 0; font-size: 11px; color: #666; }
  
  .info-sections { display: table; width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #ccc; }
  .info-sections .cell { display: table-cell; width: 33.33%; padding: 10px; border-right: 1px solid #ccc; vertical-align: top; }
  .info-sections .cell:last-child { border-right: none; }
  .cell-title { font-weight: 700; font-size: 10px; text-transform: uppercase; margin-bottom: 8px; color: #000; padding-bottom: 4px; border-bottom: 1px solid #eee; }
  .cell-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px; }
  .cell-label { font-weight: 600; color: #666; }
  .cell-value { text-align: right; color: #000; font-weight: 500; max-width: 60%; word-wrap: break-word; }

  table.details { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #ccc; }
  table.details thead th { background: #eee; padding: 8px; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #ccc; border-right: 1px solid #ccc; text-align: left; color: #222; }
  table.details tbody td { padding: 8px; font-size: 9px; color: #222; }
  
  .totals-wrapper { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: flex-start; }
  .observations { flex: 1; border: 1px solid #ccc; padding: 10px; margin-right: 15px; font-size: 8px; line-height: 1.4; color: #444; }
  .totals-table { width: 300px; border-collapse: collapse; border: 1px solid #ccc; }
  .totals-table td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 10px; }
  .totals-table .total-row td { background: #f4f4f5; font-weight: 700; font-size: 12px; border-top: 1px solid #ccc; color: #000; }
  
  .footer-norm { border: 1px solid #ccc; padding: 10px; font-size: 8px; text-align: center; color: #555; margin-bottom: 15px; }
  .footer-norm p { margin: 3px 0; }
  .cufe-box { font-family: monospace; word-break: break-all; background: #f9f9f9; padding: 5px; border: 1px solid #ddd; margin: 5px 0; color: #000; font-size: 9px; }
  
  .signatures { display: flex; justify-content: space-between; align-items: center; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
  .signature-box { flex: 1; font-size: 7px; color: #888; word-break: break-all; padding-right: 20px; line-height: 1.2; }
  .qr-box { width: 100px; text-align: right; }
  .qr-box img { width: 90px; height: 90px; }
  
  .text-right { text-align: right !important; }
  .text-center { text-align: center !important; }
</style>
</head><body>
  <div class="header">
    <div class="header-left">
      <div class="brand">
        ${logoBase64 ? '<img src="' + logoBase64 + '" alt="Logo"/>' : ''}
        <div>
          <h1>${companyName}</h1>
          <p>NIT: ${nit}-${dv} | Régimen Común</p>
        </div>
      </div>
      <p>CL 36 D SUR 27 D 39 AP 1001, Envigado, Colombia</p>
      <p>Tel: +57 (310) 877-7629 | Web: https://twosixweb.com/</p>
      <p>Contacto: twosixmarca@gmail.com | Facturación: twosixfacturaelectronica@gmail.com</p>
    </div>
    <div class="header-right">
      <h2>FACTURA ELECTRÓNICA DE VENTA</h2>
      <p style="font-size: 14px; font-weight: bold; color: #000; margin-top: 8px;">${invoice.document_number}</p>
      <p>Página 1 de 1</p>
    </div>
  </div>

  <div class="info-sections">
    <div class="cell" style="width: 40%">
      <div class="cell-title">Información del Cliente</div>
      <div class="cell-row"><span class="cell-label">Peticionario:</span> <span class="cell-value">${customer?.name || 'Cliente Mostrador'}</span></div>
      <div class="cell-row"><span class="cell-label">CC/NIT:</span> <span class="cell-value">${(customer as any)?.document_number || (customer as any)?.identification_number || '222222222222'}</span></div>
      <div class="cell-row"><span class="cell-label">Celular:</span> <span class="cell-value">${customer?.current_phone_number || 'No Registra'}</span></div>
      <div class="cell-row"><span class="cell-label">Correo:</span> <span class="cell-value">${customer?.email || 'facturas@twosix.com.co'}</span></div>
      <div class="cell-row"><span class="cell-label">Dirección / Ciudad:</span> <span class="cell-value">${order?.shipping_address || customer?.shipping_address || 'Medellín, Colombia'}</span></div>
    </div>
    <div class="cell" style="width: 60%;">
      <div class="cell-title">Datos Regulares de la Factura</div>
      <div style="display: flex; gap: 10px;">
        <div style="flex: 1;">
          <div class="cell-row"><span class="cell-label">Fecha Emisión:</span> <span class="cell-value">${invoice.issue_date.toLocaleString('es-CO')}</span></div>
          <div class="cell-row"><span class="cell-label">Fecha Vencimiento:</span> <span class="cell-value">${invoice.due_date ? invoice.due_date.toLocaleString('es-CO') : invoice.issue_date.toLocaleString('es-CO')}</span></div>
          <div class="cell-row"><span class="cell-label">Validación DIAN:</span> <span class="cell-value">${validationDate}</span></div>
        </div>
        <div style="flex: 1;">
          <div class="cell-row"><span class="cell-label">Forma de Pago:</span> <span class="cell-value">Contado (1)</span></div>
          <div class="cell-row"><span class="cell-label">Medio de Pago:</span> <span class="cell-value">Instrumento no definido (10)</span></div>
          <div class="cell-row"><span class="cell-label">No. Pedido Web:</span> <span class="cell-value">${order?.order_reference || 'N/A'}</span></div>
        </div>
      </div>
    </div>
  </div>

  <table class="details">
    <thead>
      <tr>
        <th class="text-center" style="width:5%;">#</th>
        <th style="width:35%;">Cód / Descripción</th>
        <th class="text-center" style="width:8%;">Cant.</th>
        <th class="text-center" style="width:8%;">U/M</th>
        <th class="text-right" style="width:14%;">Unitario</th>
        <th class="text-center" style="width:10%;">Imp (%)</th>
        <th class="text-right" style="width:10%;">Imp ($)</th>
        <th class="text-right" style="width:14%;">Valor Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
      <tr>
        <td colspan="8" style="background:#f4f4f5; padding:6px 8px; border:none; border-top:1px solid #ccc; font-size:8px; font-weight:600; color:#555;">
          TIPO DE OPERACIÓN: ESTÁNDAR - 10 | LÍNEAS DE DETALLE: ${items.length}
        </td>
      </tr>
    </tbody>
  </table>

  <div class="totals-wrapper">
    <div class="observations">
      <strong style="font-size: 9px; color: #000;">OBSERVACIONES DE LA FACTURA:</strong><br><br>
      Grandes contribuyentes. Somos retenedores de IVA. Responsables de IVA según normatividad vigente.<br>
      ${resText}<br><br>
      <strong>Garantías y Cambios:</strong> Para cambios de prendas, asegurese de no haberlas lavado ni cortado las marquillas. Dispone de 30 días hábiles posteriores a esta emisión para reportar novedades al canal de WhatsApp (+57 310 877-7629).<br>
      <em>Si tiene un requerimiento sobre su factura por favor escriba a twosixfacturaelectronica@gmail.com adjuntando este PDF.</em>
    </div>
    <table class="totals-table">
      <tr>
        <td>Subtotal Bruto</td>
        <td class="text-right">${formatCOP(subtotal)}</td>
      </tr>
      <tr>
        <td>Impuestos COP (IVA)</td>
        <td class="text-right">${formatCOP(iva)}</td>
      </tr>
      <tr>
        <td>Gastos de Envío</td>
        <td class="text-right">${formatCOP(shipping)}</td>
      </tr>
      <tr class="total-row">
        <td>TOTAL A PAGAR COP</td>
        <td class="text-right">${formatCOP(total)}</td>
      </tr>
    </table>
  </div>

  <div class="footer-norm">
    <p>${resText}</p>
    <div class="cufe-box">CUFE / CUDE: ${invoice.cufe_code || 'N/A'}</div>
    <p style="font-weight: 500;">Proveedor Tecnológico: TWO SIX S.A.S. - NIT: ${nit}-${dv} | Identificador de Software: TWO SIX | Representación Gráfica de Factura Electrónica De Venta</p>
  </div>

  <div class="signatures">
    <div class="signature-box">
      <strong style="color: #000;">Firma Digital Integrada:</strong><br><br>
      V7GgRZy9ds2pATJCvnNnfJzYUPw+kXPYL2QxzM44RLYsM5aMCilzrhSq6+ASsis3zxwoE3cuAXe+IARgCmsJPBo/Bm7RwdrPofT+8EWAz2VyF3R11BZhjQVSu+WOZaCcmJjQkUkk7Jzf6Nvrfx53V4qFKR744zO9zqQKlELX+xlbMqzHuO/UaRHAuFxYh/E2W/gWo...
    </div>
    ${qrImg ? '<div class="qr-box"><img src="' + qrImg + '" alt="QR DIAN"/></div>' : ''}
  </div>

</body></html>`;

    const htmlPdfNode = require('html-pdf-node');
    const pdfBuffer = await htmlPdfNode.generatePdf(
      { content: html }, 
      { 
        format: 'A4', 
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
      }
    );
    
    const fileName = order ? `Factura_${invoice.document_number}_${order.order_reference}.pdf` : `Factura_${invoice.document_number}.pdf`;

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Access-Control-Expose-Headers': 'Content-Disposition',
    });
    res.send(pdfBuffer);
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

      let orderLines = body.lines;
      let customerName = body.customerName;
      if (body.orderId && !orderLines) {
        const order = await this.prisma.order.findUnique({
          where: { id: parseInt(body.orderId, 10) },
          include: { customer: true, orderItems: true }
        });
        if (order) {
          customerName = order.customer?.name || body.customerName;
          orderLines = order.orderItems.map(item => ({
            description: item.product_name,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            taxPercent: 19
          }));
        }
      }

      const invoiceDto: InvoiceDto = {
        number: invoiceNumber,
        date: body.date || new Date().toISOString().split('T')[0],
        time: body.time || '12:00:00-05:00',
        customerName: customerName || 'Cliente Externo API',
        customerDoc: body.customerDoc || '1020304050',
        customerDocType: body.customerDocType || '13',
        lines: orderLines,

        // Pasar datos de resolución para el XML
        resolutionPrefix: resolution.prefix,
        resolutionNumber: resolution.resolutionNumber,
        resolutionStartDate: resolution.startDate.toISOString().split('T')[0],
        resolutionEndDate: resolution.endDate.toISOString().split('T')[0],
        resolutionStartNumber: resolution.startNumber,
        resolutionEndNumber: resolution.endNumber,
      };

      this.logger.log(`Generando Factura Electrónica: ${invoiceDto.number}`);

      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
      const claveTecnica = resolution.technicalKey || this.configService.get<string>('DIAN_TECHNICAL_KEY') || '';

      // 1. Generar CUFE primero
      const lines = invoiceDto.lines || [{ description: 'Producto', quantity: 1, unitPrice: 100000, taxPercent: 19 }];
      let subtotal = 0;
      let taxTotal = 0;
      lines.forEach((l: any) => {
        const up = Number(l.unitPrice.toFixed(2));
        const lt = Number((l.quantity * up).toFixed(2));
        const tp = l.taxPercent ?? 19;
        const ut = Number((up * (tp / 100)).toFixed(2));
        const t = Number((ut * l.quantity).toFixed(2));
        subtotal += lt;
        taxTotal += t;
      });
      const total = subtotal + taxTotal;

      const cufe = this.cufeService.generateCufe({
        NumFac: invoiceDto.number, FecFac: invoiceDto.date, HorFac: invoiceDto.time,
        ValFac: subtotal.toFixed(2), CodImp1: '01', ValImp1: taxTotal.toFixed(2),
        CodImp2: '04', ValImp2: '0.00', CodImp3: '03', ValImp3: '0.00',
        ValTot: total.toFixed(2), NitOfe: nit, NumAdq: invoiceDto.customerDoc,
        ClTec: claveTecnica, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      // 2. Generar XML con CUFE insertado, luego firmar
      const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
      const xmlWithCufe = xmlBase.replace(/CUFE_PLACEHOLDER/g, cufe);
      const signedXml = this.signerService.signXml(xmlWithCufe);

      // 3. Enviar a DIAN
      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), invoiceDto.number);

      const qrBase64 = await this.pdfService.generateQrBase64(
        cufe, nit, subtotal.toFixed(2), taxTotal.toFixed(2), total.toFixed(2), invoiceDto.date
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

  @Post('invoices/retry/:orderId')
  @ApiOperation({ summary: 'Reintenta generar y enviar una factura para una orden fallida' })
  @HttpCode(HttpStatus.OK)
  async retryInvoice(@Param('orderId') orderId: string, @Body() body: any) {
    try {
      const orderIdInt = parseInt(orderId, 10);
      const existingInvoice = await this.prisma.dianEInvoicing.findFirst({
        where: { id_order: orderIdInt },
        orderBy: { createdAt: 'desc' }
      });

      if (!existingInvoice) {
        throw new Error('No existe una factura previa para esta orden. Use generar factura normalmente.');
      }

      if (existingInvoice.status === 'AUTHORIZED') {
        throw new Error('La factura de esta orden ya se encuentra autorizada.');
      }

      const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');
      const resolution = await this.prisma.dianResolution.findFirst({
        where: { isActive: true, environment: env, type: 'INVOICE' },
      });
      if (!resolution) throw new Error('No hay resolución DIAN activa');

      const nextNumber = resolution.currentNumber + 1;
      await this.prisma.dianResolution.update({
        where: { id: resolution.id },
        data: { currentNumber: nextNumber },
      });

      const invoiceNumber = `${resolution.prefix}${nextNumber}`;

      const order = await this.prisma.order.findUnique({
        where: { id: orderIdInt },
        include: { customer: true, orderItems: true }
      });

      let orderLines = body.lines;
      if (order && !orderLines) {
        orderLines = order.orderItems.map(item => ({
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          taxPercent: 19
        }));
      }

      const invoiceDto = {
        number: invoiceNumber,
        date: body.date || new Date().toISOString().split('T')[0],
        time: body.time || '12:00:00-05:00',
        customerName: body.customerName || order?.customer?.name || 'Cliente Externo API',
        customerDoc: body.customerDoc || '1020304050',
        customerDocType: body.customerDocType || '13',
        lines: orderLines,
        resolutionPrefix: resolution.prefix,
        resolutionNumber: resolution.resolutionNumber,
        resolutionStartDate: resolution.startDate.toISOString().split('T')[0],
        resolutionEndDate: resolution.endDate.toISOString().split('T')[0],
        resolutionStartNumber: resolution.startNumber,
        resolutionEndNumber: resolution.endNumber,
      };

      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
      const claveTecnica = resolution.technicalKey || this.configService.get<string>('DIAN_TECHNICAL_KEY') || '';

      const lines = invoiceDto.lines || [{ description: 'Producto', quantity: 1, unitPrice: 100000, taxPercent: 19 }];
      let subtotal = 0;
      let taxTotal = 0;
      lines.forEach((l: any) => {
        const up = Number(l.unitPrice.toFixed(2));
        const lt = Number((l.quantity * up).toFixed(2));
        const tp = l.taxPercent ?? 19;
        const ut = Number((up * (tp / 100)).toFixed(2));
        const t = Number((ut * l.quantity).toFixed(2));
        subtotal += lt;
        taxTotal += t;
      });
      const total = subtotal + taxTotal;

      const cufe = this.cufeService.generateCufe({
        NumFac: invoiceDto.number, FecFac: invoiceDto.date, HorFac: invoiceDto.time,
        ValFac: subtotal.toFixed(2), CodImp1: '01', ValImp1: taxTotal.toFixed(2),
        CodImp2: '04', ValImp2: '0.00', CodImp3: '03', ValImp3: '0.00',
        ValTot: total.toFixed(2), NitOfe: nit, NumAdq: invoiceDto.customerDoc,
        ClTec: claveTecnica, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      const xmlBase = this.ublService.generateInvoiceXml(invoiceDto as any);
      const xmlWithCufe = xmlBase.replace(/CUFE_PLACEHOLDER/g, cufe);
      const signedXml = this.signerService.signXml(xmlWithCufe);

      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), invoiceDto.number);

      const qrBase64 = await this.pdfService.generateQrBase64(
        cufe, nit, subtotal.toFixed(2), taxTotal.toFixed(2), total.toFixed(2), invoiceDto.date
      );

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
          id_order: orderIdInt,
          id_dian_resolution: resolution.id,
        },
      });

      return {
        success: true,
        message: 'Factura DIAN reintentada con éxito',
        invoiceId: saved.id,
        cufe,
        qrCode: qrBase64,
        dianResponse: soapResponse,
      };
    } catch (error) {
      this.logger.error('Error reintentando Factura DIAN', error);
      throw new HttpException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @Post('invoices/:id/credit-note')
  @ApiOperation({ summary: 'Generar Nota Crédito para una Factura' })
  async createCreditNote(@Param('id') id: string, @Body() body: any) {
    try {
      const invoice = await this.prisma.dianEInvoicing.findUnique({
        where: { id: parseInt(id, 10) },
        include: { order: { include: { customer: true, orderItems: true } } }
      });

      if (!invoice || !invoice.cufe_code) {
        throw new Error('La factura no existe o no tiene CUFE');
      }

      const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');
      const resolution = await this.prisma.dianResolution.findFirst({
        where: { isActive: true, environment: env, type: 'CREDIT_NOTE' },
      });

      if (!resolution) throw new Error('No hay resolución configurada para Notas Crédito');

      const nextNumber = resolution.currentNumber + 1;
      await this.prisma.dianResolution.update({
        where: { id: resolution.id },
        data: { currentNumber: nextNumber },
      });

      const noteNumber = `${resolution.prefix}${nextNumber}`;
      const customer = invoice.order?.customer;

      const noteDto: NoteDto = {
        number: noteNumber,
        date: new Date().toISOString().split('T')[0],
        time: '12:00:00-05:00',
        customerName: customer?.name || 'Cliente',
        customerDoc: body.customerDoc || '222222222222',
        customerDocType: body.customerDocType || '13',
        paymentMeansCode: '10',
        lines: body.lines || [{ description: 'Devolución Total', quantity: 1, unitPrice: invoice.order!.iva ? (invoice.order!.total_payment - invoice.order!.iva) : 100000, taxPercent: 19 }],
        originalInvoiceNumber: invoice.document_number,
        resolutionPrefix: resolution.prefix,
        originalInvoiceDate: invoice.issue_date.toISOString().split('T')[0],
        originalInvoiceCufe: invoice.cufe_code,
        reasonCode: body.reasonCode || '2', // 2 = Anulación de factura electrónica
        reasonDesc: body.reasonDesc || 'Anulación por devolución',
      };

      const softwarePin = this.configService.get<string>('DIAN_SOFTWARE_PIN') || '';
      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';

      // 1. Calcular Totales para CUDE asegurando 2 decimales limpios
      const subtotalRaw = noteDto.lines!.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const subtotalStr = subtotalRaw.toFixed(2);
      const subtotal = Number(subtotalStr);

      const taxTotalRaw = subtotal * 0.19;
      const taxTotalStr = taxTotalRaw.toFixed(2);
      const taxTotal = Number(taxTotalStr);

      const totalRaw = subtotal + taxTotal;
      const totalStr = totalRaw.toFixed(2);
      const total = Number(totalStr);

      // 2. Generar CUDE
      const cude = this.cufeService.generateCude({
        NumNota: noteDto.number, FecNota: noteDto.date, HorNota: noteDto.time,
        ValNota: subtotalStr, CodImp1: '01', ValImp1: taxTotalStr,
        CodImp2: '04', ValImp2: '0.00', CodImp3: '03', ValImp3: '0.00',
        ValTot: totalStr, NitOfe: nit, NumAdq: noteDto.customerDoc,
        PinSoftware: softwarePin, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      // 3. Generar XML XML y Firmar
      const xmlBase = this.ublService.generateCreditNoteXml(noteDto);
      const xmlWithCude = xmlBase.replace(/CUFE_PLACEHOLDER/g, cude);
      const signedXml = this.signerService.signXml(xmlWithCude);

      // 4. Enviar a DIAN
      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), noteDto.number);

      // 5. Guardar en Base de Datos
      const savedNote = await this.prisma.dianNote.create({
        data: {
          id_dian_invoice: invoice.id,
          type: 'CREDIT',
          note_number: noteNumber,
          cude: cude,
          issue_date: new Date(noteDto.date),
          reason_code: noteDto.reasonCode,
          reason_desc: noteDto.reasonDesc,
          amount: total,
          status: 'SENT',
          dian_status_code: 'UNKNOWN',
          status_message: typeof soapResponse === 'string' ? soapResponse : JSON.stringify(soapResponse),
        }
      });

      return {
        success: true,
        message: 'Nota Crédito enviada a la DIAN',
        noteId: savedNote.id,
        cude,
        dianResponse: soapResponse,
      };
    } catch (error) {
      this.logger.error('Error generando Nota Crédito', error);
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('invoices/:id/debit-note')
  @ApiOperation({ summary: 'Generar Nota Débito para una Factura' })
  async createDebitNote(@Param('id') id: string, @Body() body: any) {
    try {
      const invoice = await this.prisma.dianEInvoicing.findUnique({
        where: { id: parseInt(id, 10) },
        include: { order: { include: { customer: true, orderItems: true } } }
      });

      if (!invoice || !invoice.cufe_code) {
        throw new Error('La factura no existe o no tiene CUFE');
      }

      const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');
      const resolution = await this.prisma.dianResolution.findFirst({
        where: { isActive: true, environment: env, type: 'DEBIT_NOTE' },
      });

      if (!resolution) throw new Error('No hay resolución configurada para Notas Débito');

      const nextNumber = resolution.currentNumber + 1;
      await this.prisma.dianResolution.update({
        where: { id: resolution.id },
        data: { currentNumber: nextNumber },
      });

      const noteNumber = `${resolution.prefix}${nextNumber}`;
      const customer = invoice.order?.customer;

      const noteDto: NoteDto = {
        number: noteNumber,
        date: new Date().toISOString().split('T')[0],
        time: '12:00:00-05:00',
        customerName: customer?.name || 'Cliente',
        customerDoc: body.customerDoc || '222222222222',
        customerDocType: body.customerDocType || '13',
        paymentMeansCode: '10',
        lines: body.lines || [{ description: 'Ajuste de precio', quantity: 1, unitPrice: 10000, taxPercent: 19 }],
        originalInvoiceNumber: invoice.document_number,
        resolutionPrefix: resolution.prefix,
        originalInvoiceDate: invoice.issue_date.toISOString().split('T')[0],
        originalInvoiceCufe: invoice.cufe_code,
        reasonCode: body.reasonCode || '4', // 4 = Otros
        reasonDesc: body.reasonDesc || 'Ajuste adicional',
      };

      const softwarePin = this.configService.get<string>('DIAN_SOFTWARE_PIN') || '';
      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';

      // 1. Calcular Totales para CUDE
      const subtotal = noteDto.lines!.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
      const taxTotal = Math.round(subtotal * 0.19);
      const total = subtotal + taxTotal;

      // 2. Generar CUDE
      const cude = this.cufeService.generateCude({
        NumNota: noteDto.number, FecNota: noteDto.date, HorNota: noteDto.time,
        ValNota: subtotal.toFixed(2), CodImp1: '01', ValImp1: taxTotal.toFixed(2),
        CodImp2: '04', ValImp2: '0.00', CodImp3: '03', ValImp3: '0.00',
        ValTot: total.toFixed(2), NitOfe: nit, NumAdq: noteDto.customerDoc,
        PinSoftware: softwarePin, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      // 3. Generar XML y Firmar
      const xmlBase = this.ublService.generateDebitNoteXml(noteDto);
      const xmlWithCude = xmlBase.replace(/CUFE_PLACEHOLDER/g, cude);
      const signedXml = this.signerService.signXml(xmlWithCude);

      // 4. Enviar a DIAN
      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), noteDto.number);

      // 5. Guardar en Base de Datos
      const savedNote = await this.prisma.dianNote.create({
        data: {
          id_dian_invoice: invoice.id,
          type: 'DEBIT',
          note_number: noteNumber,
          cude: cude,
          issue_date: new Date(noteDto.date),
          reason_code: noteDto.reasonCode,
          reason_desc: noteDto.reasonDesc,
          amount: total,
          status: 'SENT',
          dian_status_code: 'UNKNOWN',
          status_message: typeof soapResponse === 'string' ? soapResponse : JSON.stringify(soapResponse),
        }
      });

      return {
        success: true,
        message: 'Nota Débito enviada a la DIAN',
        noteId: savedNote.id,
        cude,
        dianResponse: soapResponse,
      };
    } catch (error) {
      this.logger.error('Error generando Nota Débito', error);
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('invoices/:id/notes')
  @ApiOperation({ summary: 'Obtener Notas Crédito y Débito asociadas a una Factura' })
  async getInvoiceNotes(@Param('id') id: string) {
    return this.prisma.dianNote.findMany({
      where: { id_dian_invoice: parseInt(id, 10) },
      orderBy: { createdAt: 'desc' }
    });
  }

  @Post('notes/:id/sync-status')
  @ApiOperation({ summary: 'Consultar y actualizar el estado de una Nota con DIAN' })
  async syncNoteStatus(@Param('id') id: string) {
    try {
      const note = await this.prisma.dianNote.findUnique({
        where: { id: parseInt(id, 10) }
      });

      if (!note || !note.status_message) {
        throw new Error('Nota no encontrada o sin mensaje de respuesta DIAN original');
      }

      // 1. Extraer ZipKey
      const zipKeyMatch = note.status_message.match(/<b:ZipKey>(.*?)<\/b:ZipKey>/);
      if (!zipKeyMatch) {
        throw new Error('No se encontró ZipKey en la respuesta original de la Nota');
      }
      const trackId = zipKeyMatch[1];

      // 2. Consultar DIAN
      const rawResponse = await this.soapService.getStatusZip(trackId);
      const xmlBase64Bytes = rawResponse.match(/<b:XmlBase64Bytes>(.*?)<\/b:XmlBase64Bytes>/s)?.[1];
      const isValid = rawResponse.match(/<b:IsValid>(.*?)<\/b:IsValid>/)?.[1] === 'true';
      const statusCode = rawResponse.match(/<b:StatusCode>(.*?)<\/b:StatusCode>/)?.[1] || 'UNKNOWN';
      const statusDescription = rawResponse.match(/<b:StatusDescription>(.*?)<\/b:StatusDescription>/)?.[1] || '';

      // 3. Determinar estado
      let newStatus = note.status;
      if (isValid && statusCode === '00') {
        newStatus = 'AUTHORIZED';
      } else if (!isValid && statusCode === '2') {
        newStatus = 'AUTHORIZED'; // En Sandbox, '2' indica Set de Pruebas Aceptado
      } else if (!isValid && parseInt(statusCode, 10) >= 60) {
        newStatus = 'REJECTED';
      } else if (statusCode !== 'UNKNOWN') {
        newStatus = 'PROCESSED'; // Processed but maybe not valid or has remarks
      }

      // 4. Actualizar base de datos
      const updatedNote = await this.prisma.dianNote.update({
        where: { id: note.id },
        data: {
          dian_status_code: statusCode,
          status: newStatus,
          status_message: rawResponse, // Opcional: reemplazar respuesta asíncrona
          ...(xmlBase64Bytes ? { dian_zip_base64: xmlBase64Bytes } : {}),
        }
      });

      return {
        success: true,
        trackId,
        isValid,
        statusCode,
        statusDescription,
        note: updatedNote,
      };
    } catch (error) {
      this.logger.error('Error sincronizando estado de Nota:', error);
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

