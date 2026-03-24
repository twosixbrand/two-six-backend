import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DianUblService, InvoiceDto } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';
import * as nodemailer from 'nodemailer';
import AdmZip = require('adm-zip');

@Injectable()
export class DianEmailService {
  private readonly logger = new Logger(DianEmailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private ublService: DianUblService,
    private signerService: DianSignerService,
    private pdfService: DianPdfService,
  ) {
    this.initTransporter();
  }

  private initTransporter() {
    const user = this.configService.get<string>('DIAN_EMAIL_USER');
    const pass = this.configService.get<string>('DIAN_EMAIL_PASSWORD');
    const host = this.configService.get<string>('EMAIL_SERVER_HOST');
    const port = Number(this.configService.get<string>('EMAIL_SERVER_PORT'));

    if (user && pass && host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: true,
        auth: { user, pass },
      });
      this.logger.log(`DIAN Transporter initialized for: ${user}`);
    } else {
      this.logger.warn('Faltan variables DIAN_EMAIL_USER / PASSWORD / HOST en .env. El correo DIAN no saldrá.');
    }
  }

  async sendDianInvoiceEmail(invoiceId: number): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error('No se configuró el transportador DIAN_EMAIL_. Abortando envío.');
      return false;
    }

    const invoice = await this.prisma.dianEInvoicing.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { customer: true, orderItems: true } } },
    });

    if (!invoice || !invoice.order || !invoice.order.customer) {
      this.logger.error(`Factura ${invoiceId} inválida o sin cliente asociado.`);
      return false;
    }

    if (invoice.email_sent) {
      this.logger.warn(`El correo de la Factura ${invoice.document_number} ya fue enviado previamente.`);
      return true; // Si ya se envió, evitamos reenviar
    }

    try {
      this.logger.log(`Generando archivos (XML y PDF) para la factura ${invoice.document_number}...`);

      // 1. Reconstruir UBL XML y Firmarlo
      const resolution = await this.prisma.dianResolution.findFirst({
        where: { id: invoice.id_dian_resolution || 0 },
      }) || await this.prisma.dianResolution.findFirst({
        where: { isActive: true, environment: invoice.environment as any, type: 'INVOICE' },
      });

      const invoiceDto: InvoiceDto = {
        number: invoice.document_number,
        date: invoice.issue_date.toISOString().split('T')[0],
        time: '12:00:00-05:00',
        customerName: invoice.order.customer.name,
        customerDoc: (invoice.order.customer as any).document_number || (invoice.order.customer as any).identification_number || '222222222222',
        customerDocType: String(invoice.order.customer.id_identification_type) || '13',
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

      // 2. Generar PDF
      const pdfBuffer = await this.generatePdfBuffer(invoice, invoice.order);

      // 3. Crear el archivo ZIP (Normativa DIAN)
      const zip = new AdmZip();
      zip.addFile(`Factura_${invoice.document_number}.xml`, Buffer.from(signedXml, 'utf-8'));
      zip.addFile(`Factura_${invoice.document_number}.pdf`, pdfBuffer);
      const zipBuffer = zip.toBuffer();

      const customerEmail = invoice.order.customer.email;
      const dianSender = this.configService.get<string>('DIAN_EMAIL_USER') || 'twosixfacturaelectronica@gmail.com';
      const companyName = this.configService.get<string>('DIAN_COMPANY_NAME') || 'TWO SIX S.A.S.';

      const mailOptions = {
        from: `"${companyName}" <${dianSender}>`,
        to: customerEmail,
        bcc: dianSender, // Copia oculta obligatoria
        subject: `Factura Electrónica ${invoice.document_number} - ${companyName}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa;">
             <h1 style="color: #000; margin: 0;">${companyName}</h1>
             <p style="color: #666; font-size: 14px; letter-spacing: 2px;">FACTURA ELECTRÓNICA DE VENTA</p>
          </div>
          <div style="padding: 20px;">
             <p>Estimado/a <strong>${invoice.order.customer.name}</strong>,</p>
             <p>Adjunto a este correo encontrará el documento electrónico <b>.zip</b> correspondiente a su compra (Factura No. ${invoice.document_number}), en cumplimiento con la normatividad de Facturación Electrónica de la DIAN (Anexo Técnico 1.8).</p>
             <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; border-left: 4px solid #000; word-break: break-all; font-size: 11px;">
                <strong>CUFE:</strong><br/> ${invoice.cufe_code || 'N/A'}
             </div>
             <p>El archivo comprimido contiene la representación gráfica (PDF) y el documento oficial XML firmado.</p>
             <p>Gracias por confiar en nosotros.</p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 11px; color: #999;">
             Este es un correo automático. Si tiene alguna solicitud, por favor responda a este mismo mensaje.
          </div>
        </div>
        `,
        attachments: [
          {
            filename: `Factura_Electronica_${invoice.document_number}.zip`,
            content: zipBuffer,
          }
        ],
      };

      this.logger.log(`Enviando factura electrónica (ZIP) a ${customerEmail}...`);
      await this.transporter.sendMail(mailOptions);
      this.logger.log(`Correo Legal DIAN enviado exitosamente para ${invoice.document_number}.`);

      // Marcar como enviado
      await this.prisma.dianEInvoicing.update({
        where: { id: invoiceId },
        data: { email_sent: true },
      });

      return true;
    } catch (err) {
      this.logger.error(`Error despachando el correo DIAN para factura ${invoiceId}: ${err.message}`);
      return false;
    }
  }

  private async generatePdfBuffer(invoice: any, order: any): Promise<Buffer> {
    const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.configService.get<string>('DIAN_COMPANY_DV') || '';
    const companyName = this.configService.get<string>('DIAN_COMPANY_NAME') || 'TWO SIX S.A.S.';

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
      : '<tr><td colspan="6" class="text-center" style="color: #888;">Factura generada sin detalle de productos</td></tr>';

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

    const resText = 'Facturación Electrónica autorizada por la DIAN. Régimen Común.';
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
      .firma-line { font-size: 6.5px; color: #475569; margin-top: 4px; }
      .firma-line span { font-family: 'Courier New', monospace; word-break: break-all; font-size: 6px; }

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
            <div class="ib-row"><span class="lbl">CC / NIT</span><span class="val">${(customer as any)?.document_number || '222222222222'}</span></div>
            <div class="ib-row"><span class="lbl">Teléfono</span><span class="val">${customer?.current_phone_number || 'N/A'}</span></div>
            <div class="ib-row"><span class="lbl">Dirección / Ubi.</span><span class="val">${order?.shipping_address || 'No registrada'}</span></div>
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
    return await htmlPdfNode.generatePdf(
      { content: html },
      { format: 'A4', printBackground: true, margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }, args: ['--no-sandbox'] }
    );
  }
}
