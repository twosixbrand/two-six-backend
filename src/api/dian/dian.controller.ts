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
  ) { }

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
          <td class="text-center">${item.id_product || i + 1}</td>
          <td>${item.product_name} ${item.size ? '- Talla ' + item.size : ''}</td>
          <td class="text-center">${item.quantity}</td>
          <td class="text-right">${formatCOP(item.unit_price)}</td>
          <td class="text-center">${order?.iva && order.iva > 0 ? '19%' : '0%'}</td>
          <td class="text-right">${formatCOP(item.unit_price * item.quantity)}</td>
        </tr>`).join('')
      : '<tr><td colspan="6" class="text-center" style="color: #888;">Factura generada sin detalle de productos (prueba API)</td></tr>';

    // Regenerar QR con URL limpia si el actual no funciona
    const qrUrl = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${invoice.cufe_code}`;
    let qrImg = invoice.qr_code;
    if (!qrImg || !qrImg.startsWith('data:image')) {
      qrImg = await this.pdfService.generateQrBase64(invoice.cufe_code || '', nit, '0', '0', '0', '');
    }

    const fsNative = require('fs');
    const pathNative = require('path');
    const logoPath = pathNative.join(process.cwd(), '../two-six-web/public/logo-gorilla.png');
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; font-size: 9px; color: #1e293b; background: #fff; }

      /* ═══ HEADER ═══ */
      .hdr { background: linear-gradient(135deg, #131313 0%, #1a1a1a 40%, #222222 100%); padding: 22px 28px 18px; display: flex; justify-content: space-between; align-items: flex-start; position: relative; }
      .hdr::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: linear-gradient(90deg, #b8962e, #d4af37, #f5d76e, #d4af37, #b8962e); }
      .hdr-left { display: flex; gap: 14px; align-items: center; }
      .logo-icon { width: 50px; height: 50px; filter: drop-shadow(0 0 12px rgba(255, 255, 255, 0.5)); flex-shrink: 0; }
      .logo-icon img { width: 100%; height: 100%; object-fit: contain; }
      .hdr-info { display: flex; flex-direction: column; justify-content: center; }
      .hdr-info .co-name { margin-bottom: 2px; height: 26px; }
      .hdr-info .co-sub { font-size: 8px; color: #d4af37; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; opacity: 0.95; }
      .hdr-info .co-detail { font-size: 7.5px; line-height: 1.8; color: #999; }
      .hdr-info .co-detail b { color: #ccc; font-weight: 400; }
      .hdr-right { display: flex; gap: 18px; align-items: center; text-align: right; }
      .hdr-right-text { display: flex; flex-direction: column; align-items: center; }
      .hdr-right-text .fe-label { font-family: 'Georgia', 'Times New Roman', serif; font-size: 14px; font-weight: 400; color: #ffffff; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 6px; }
      .hdr-right-text .doc-num-wrap { padding: 5px 0; margin-bottom: 6px; position: relative; width: 100%; text-align: center; }
      .hdr-right-text .doc-num-wrap::before { content: ''; position: absolute; top: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, #b8962e, #f5d76e, #b8962e, transparent); }
      .hdr-right-text .doc-num-wrap::after { content: ''; position: absolute; bottom: 0; left: 10%; right: 10%; height: 1px; background: linear-gradient(90deg, transparent, #b8962e, #f5d76e, #b8962e, transparent); }
      .hdr-right-text .doc-num { font-size: 22px; font-weight: 800; color: #d4af37; letter-spacing: 2px; }
      .hdr-right-text .doc-dates { font-size: 7.5px; color: #888; line-height: 1.7; text-align: center; }
      .hdr-right-text .doc-dates b { color: #bbb; }
      .hdr-qr img { width: 68px; height: 68px; border: 1px solid #d4af37; border-radius: 4px; background: #fff; padding: 2px; }

      /* ═══ GOLD BAR ═══ */
      .gold-bar { height: 4px; background: linear-gradient(90deg, #b8962e, #d4af37, #f5d76e, #d4af37, #b8962e); }

      /* ═══ BODY ═══ */
      .body { padding: 24px 28px 18px; background: linear-gradient(135deg, #f6f7f9 0%, #e2e8f0 100%); }

      /* ═══ INFO SECTION ═══ */
      .info-grid { display: flex; gap: 16px; margin-bottom: 16px; }
      .info-box { flex: 1; border: 1px solid #cbd5e1; border-left: 4px solid #d4af37; border-radius: 0 6px 6px 0; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .info-box .ib-title { padding: 7px 12px; font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.2px; color: #0f172a; border-bottom: 1px solid #f0ebe0; background: linear-gradient(90deg, rgba(212,175,55,0.08) 0%, transparent 100%); }
      .info-box .ib-title .icon { margin-right: 6px; }
      .info-box .ib-row { display: flex; justify-content: space-between; padding: 5px 12px; border-bottom: 1px solid #f8f5ee; font-size: 9px; }
      .info-box .ib-row:last-child { border-bottom: none; }
      .info-box .ib-row .lbl { color: #7c7362; font-weight: 600; font-size: 8px; text-transform: uppercase; }
      .info-box .ib-row .val { color: #0f172a; font-weight: 700; text-align: right; max-width: 60%; }

      /* ═══ ITEMS TABLE ═══ */
      .tbl-wrap { border: 2px solid #d4af37; border-radius: 8px; overflow: hidden; margin-bottom: 6px; background: #fff; box-shadow: 0 4px 8px rgba(0,0,0,0.03); }
      .tbl { width: 100%; border-collapse: collapse; }
      .tbl thead th { background: linear-gradient(135deg, #131313, #222222); color: #d4af37; padding: 9px 10px; font-size: 8px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 800; text-align: left; }
      .tbl tbody td { padding: 8px 10px; font-size: 9px; color: #1e293b; border-bottom: 1px solid #f0ebe0; font-weight: 500; }
      .tbl tbody tr:nth-child(even) td { background: #fdfcf8; }
      .tbl tbody tr:last-child td { border-bottom: none; }
      .tbl .td-total { color: #d4af37; font-weight: 800; font-size: 10px; }
      .tbl-footer { text-align: center; padding: 5px; font-size: 7.5px; color: #94a3b8; border-top: 1px dashed #e5e0d0; background: #fdfcf8; }

      /* ═══ BOTTOM SECTION ═══ */
      .bottom { display: flex; gap: 16px; margin-top: 14px; }
      .obs-col { flex: 1; }
      .obs-title { font-size: 8.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; padding-bottom: 4px; border-bottom: 2px solid #d4af37; margin-bottom: 8px; display: inline-block; }
      .obs-txt { font-size: 8px; color: #475569; line-height: 1.5; }
      .obs-txt b { color: #0f172a; }
      .obs-contact { margin-top: 8px; background: linear-gradient(90deg, rgba(212,175,55,0.08), transparent); border-left: 3px solid #d4af37; padding: 6px 10px; border-radius: 0 4px 4px 0; font-size: 7.5px; color: #475569; }
      .obs-contact a { color: #d4af37; font-weight: 700; text-decoration: none; }

      /* ═══ TOTALS ═══ */
      .tot-col { width: 260px; }
      .tot-box { border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
      .tot-row { display: flex; justify-content: space-between; padding: 7px 14px; border-bottom: 1px solid #f0ebe0; }
      .tot-row .tl { font-size: 8.5px; color: #64748b; font-weight: 600; }
      .tot-row .tv { font-size: 10px; color: #0f172a; font-weight: 700; }
      .tot-grand { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: linear-gradient(135deg, #d4af37 0%, #f5d76e 50%, #d4af37 100%); }
      .tot-grand .tl { font-size: 10px; color: #0f172a; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
      .tot-grand .tv { font-size: 16px; color: #0f172a; font-weight: 800; }

      /* ═══ THANK YOU ═══ */
      .thanks { text-align: center; margin: 20px 0 8px; }
      .thanks .msg { font-size: 14px; font-style: italic; color: #d4af37; font-weight: 600; }
      .thanks .brand-line { font-size: 11px; font-weight: 700; color: #0f172a; margin-top: 3px; font-style: italic; }

      /* ═══ DARK FOOTER ═══ */
      .dark-foot { background: linear-gradient(135deg, #131313 0%, #1a1a1a 40%, #222222 100%); padding: 18px 28px; color: #94a3b8; font-size: 8px; line-height: 1.6; }
      .foot-row { margin-bottom: 5px; }
      .foot-cufe-label { color: #d4af37; font-weight: 800; }
      .foot-cufe-val { color: #f8fafc; word-break: break-all; }
      .foot-text { color: #94a3b8; }

      .text-right { text-align: right !important; }
      .text-center { text-align: center !important; }
    </style>
    </head><body>

      <!-- ═══ HEADER ═══ -->
      <div class="hdr">
        <div class="hdr-left">
          ${logoBase64 ? '<div class="logo-icon"><img src="' + logoBase64 + '" alt="Two Six"/></div>' : ''}
          <div class="hdr-info">
            <div class="co-name">
              <svg width="220" height="28" viewBox="0 0 220 28" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#b8962e"/>
                    <stop offset="50%" stop-color="#fef0a0"/>
                    <stop offset="100%" stop-color="#d4af37"/>
                  </linearGradient>
                </defs>
                <text x="0" y="22" font-family="Georgia, serif" font-size="22px" font-weight="800" fill="url(#goldGrad)" letter-spacing="5">TWO SIX</text>
              </svg>
            </div>
            <div class="co-sub">CRAFTED FOR REAL ONES</div>
            <div class="co-detail">
              <b>TWO SIX S.A.S. | NIT:</b> ${nit}-${dv} <b>|</b> Régimen Común<br>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 2px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> CL 36 D SUR 27 D 39 <span style="color: #d4af37; margin: 0 4px">•</span> Envigado, Colombia<br>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 2px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> +57 (310) 877-7629 &nbsp;&nbsp; <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 2px;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> twosixweb.com<br>
              <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="#d4af37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -2px; margin-right: 2px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> twosixfacturaelectronica@gmail.com
            </div>
          </div>
        </div>
        <div class="hdr-right">
          <div class="hdr-right-text">
            <div class="fe-label">Factura Electrónica</div>
            <div class="doc-num-wrap">
              <div class="doc-num">${invoice.document_number}</div>
            </div>
            <div class="doc-dates">
              Emitida: <b>${invoice.issue_date.toLocaleString('es-CO')}</b><br>
              Validación DIAN: <b>${validationDate}</b>
            </div>
          </div>
          ${qrImg ? '<div class="hdr-qr"><img src="' + qrImg + '" alt="QR"/></div>' : ''}
        </div>
      </div>

      <!-- ═══ GOLD BAR ═══ -->
      <div class="gold-bar"></div>

      <!-- ═══ BODY ═══ -->
      <div class="body">

        <!-- INFO CARDS -->
        <div class="info-grid">
          <div class="info-box">
            <div class="ib-title"><span class="icon">👤</span> Facturar A</div>
            <div class="ib-row"><span class="lbl">Razón Social / Nombre</span><span class="val">${customer?.name || 'Cliente'}</span></div>
            <div class="ib-row"><span class="lbl">CC / NIT</span><span class="val">${(customer as any)?.document_number || (customer as any)?.identification_number || '222222222222'}</span></div>
            <div class="ib-row"><span class="lbl">Teléfono</span><span class="val">${customer?.current_phone_number || 'N/A'}</span></div>
            <div class="ib-row"><span class="lbl">Dirección / Ubi.</span><span class="val">${order?.shipping_address || customer?.shipping_address || 'No registrada'}</span></div>
            <div class="ib-row"><span class="lbl">Correo Electrónico</span><span class="val">${customer?.email || 'N/A'}</span></div>
          </div>
          <div class="info-box">
            <div class="ib-title"><span class="icon">📄</span> Datos del Documento</div>
            <div class="ib-row"><span class="lbl">Forma de Pago</span><span class="val">Contado (1)</span></div>
            <div class="ib-row"><span class="lbl">Medio de Pago</span><span class="val">Instrumento no definido (10)</span></div>
            <div class="ib-row"><span class="lbl">Pedido Web</span><span class="val">${order?.order_reference || 'N/A'}</span></div>
            <div class="ib-row"><span class="lbl">Moneda</span><span class="val">COP (Pesos Colombianos)</span></div>
            <div class="ib-row"><span class="lbl">Tipo Operación</span><span class="val">Estándar (10)</span></div>
          </div>
        </div>

        <!-- ITEMS TABLE -->
        <div class="tbl-wrap">
          <table class="tbl">
            <thead>
              <tr>
                <th class="text-center" style="width:5%">#</th>
                <th style="width:42%">Descripción</th>
                <th class="text-center" style="width:8%">Cant.</th>
                <th class="text-right" style="width:15%">V. Unitario</th>
                <th class="text-center" style="width:10%">% IVA</th>
                <th class="text-right" style="width:20%">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="tbl-footer">· · ·&nbsp;&nbsp;&nbsp;FIN DEL DETALLE &nbsp;|&nbsp; TIPO OPERACIÓN: 10&nbsp;&nbsp;&nbsp;· · ·</div>
        </div>

        <!-- OBSERVATIONS + TOTALS -->
        <div class="bottom">
          <div class="obs-col">
            <div class="obs-title">Condiciones y Observaciones</div>
            <div class="obs-txt">
              ${resText}<br><br>
              <b>Garantías y Cambios:</b> Para cambios de prendas, asegúrese de no haberlas lavado ni cortado las marquillas. Dispone de 30 días hábiles posteriores a esta emisión para reportar novedades al canal de WhatsApp <b>(+57 310 877-7629)</b>.
            </div>
            <div class="obs-contact">
              Para consultas sobre esta factura, escriba a<br>
              <a href="mailto:twosixfacturaelectronica@gmail.com">twosixfacturaelectronica@gmail.com</a> adjuntando este archivo.
            </div>
          </div>
          <div class="tot-col">
            <div class="tot-box">
              <div class="tot-row"><span class="tl">Subtotal Bruto</span><span class="tv">${formatCOP(subtotal)}</span></div>
              <div class="tot-row"><span class="tl">Gastos de Envío</span><span class="tv">${formatCOP(shipping)}</span></div>
              <div class="tot-row"><span class="tl">Impuestos (IVA)</span><span class="tv">${formatCOP(iva)}</span></div>
              <div class="tot-grand"><span class="tl">Total a Pagar</span><span class="tv">${formatCOP(total)}</span></div>
            </div>
          </div>
        </div>

        <!-- THANK YOU -->
        <div class="thanks">
          <div class="msg">Gracias por ser parte de Two Six</div>
          <div class="brand-line">Two Six — Crafted for real ones</div>
        </div>

      </div>

      <!-- ═══ DARK FOOTER ═══ -->
      <div class="gold-bar"></div>
      <div class="dark-foot">
        <div class="foot-row">
          <span class="foot-cufe-label">CUFE/CUDE: </span>
          <span class="foot-cufe-val">${invoice.cufe_code || 'N/A'}</span>
        </div>
        <div class="foot-text">
          Proveedor Tecnológico: TWO SIX S.A.S. - NIT: ${nit}-${dv} &nbsp;|&nbsp; Identificador de Software: TWO SIX<br>
          Representación Gráfica de Factura Electrónica De Venta. Firma Digital Integrada en el XML adjunto.
        </div>
      </div>

    </body></html>`;


    const htmlPdfNode = require('html-pdf-node');
    const pdfBuffer = await htmlPdfNode.generatePdf(
      { content: html },
      {
        format: 'A4',
        printBackground: true,
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

