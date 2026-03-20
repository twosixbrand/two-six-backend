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
      const cufe = this.cufeService.generateCufe({
        NumFac: invoiceDto.number, FecFac: invoiceDto.date, HorFac: invoiceDto.time,
        ValFac: '100000.00', CodImp1: '01', ValImp1: '19000.00',
        CodImp2: '', ValImp2: '', CodImp3: '', ValImp3: '',
        ValTot: '119000.00', NitOfe: nit, NumAdq: invoiceDto.customerDoc,
        ClTec: claveTecnica, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      // 2. Generar XML con CUFE insertado, luego firmar
      const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
      const xmlWithCufe = xmlBase.replace(/CUFE_PLACEHOLDER/g, cufe);
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
        originalInvoiceDate: invoice.issue_date.toISOString().split('T')[0],
        originalInvoiceCufe: invoice.cufe_code,
        reasonCode: body.reasonCode || '2', // 2 = Anulación de factura electrónica
        reasonDesc: body.reasonDesc || 'Anulación por devolución',
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
        CodImp2: '', ValImp2: '', CodImp3: '', ValImp3: '',
        ValTot: total.toFixed(2), NitOfe: nit, NumAdq: noteDto.customerDoc,
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
        CodImp2: '', ValImp2: '', CodImp3: '', ValImp3: '',
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
          status_message: rawResponse, // Opcional: reemplazar respuesta asíncrona por respuesta de validación final
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

