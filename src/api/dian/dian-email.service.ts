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
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${item.id_product || i + 1}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${item.product_name} ${item.size ? '- Talla '+item.size : ''}</td>
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${item.quantity}</td>
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">94</td>
          <td class="text-right" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${formatCOP(item.unit_price)}</td>
          <td class="text-center" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${order?.iva && order.iva > 0 ? '19%' : '0%'}</td>
          <td class="text-right" style="padding: 8px; border-bottom: 1px solid #eee; border-right: 1px solid #eee;">${formatCOP(order?.iva && order.iva > 0 ? item.unit_price * 0.19 : 0)}</td>
          <td class="text-right" style="padding: 8px; border-bottom: 1px solid #eee;">${formatCOP(item.unit_price * item.quantity)}</td>
        </tr>`).join('')
      : '<tr><td colspan="8" class="text-center" style="padding: 8px; color: #888;">Factura generada sin detalle de productos</td></tr>';

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

    const resText = 'Facturación Electrónica autorizada por la DIAN. Régimen Común.';
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
      .cell-title { font-weight: 700; font-size: 10px; text-transform: uppercase; margin-bottom: 8px; color: #000; padding-bottom: 4px; border-bottom: 1px solid #eee; }
      .cell-row { display: flex; justify-content: space-between; margin-bottom: 4px; font-size: 9px; }
      .cell-label { font-weight: 600; color: #666; }
      .cell-value { text-align: right; color: #000; font-weight: 500; max-width: 60%; word-wrap: break-word; }
      table.details { width: 100%; border-collapse: collapse; margin-bottom: 15px; border: 1px solid #ccc; }
      table.details thead th { background: #eee; padding: 8px; font-size: 9px; text-transform: uppercase; border-bottom: 1px solid #ccc; text-align: left; }
      table.details tbody td { padding: 8px; font-size: 9px; color: #222; }
      .totals-wrapper { display: flex; justify-content: space-between; margin-bottom: 20px; align-items: flex-start; }
      .observations { flex: 1; border: 1px solid #ccc; padding: 10px; margin-right: 15px; font-size: 8px; color: #444; }
      .totals-table { width: 300px; border-collapse: collapse; border: 1px solid #ccc; }
      .totals-table td { padding: 6px 10px; border-bottom: 1px solid #eee; font-size: 10px; }
      .totals-table .total-row td { background: #f4f4f5; font-weight: 700; font-size: 12px; border-top: 1px solid #ccc; }
      .footer-norm { border: 1px solid #ccc; padding: 10px; font-size: 8px; text-align: center; margin-bottom: 15px; }
      .cufe-box { font-family: monospace; word-break: break-all; background: #f9f9f9; padding: 5px; border: 1px solid #ddd; margin: 5px 0; font-size: 9px; }
      .signatures { display: flex; justify-content: space-between; align-items: center; border: 1px solid #ccc; padding: 10px; border-radius: 4px; }
      .signature-box { flex: 1; font-size: 7px; color: #888; word-break: break-all; padding-right: 20px; line-height: 1.2; }
      .qr-box img { width: 90px; height: 90px; }
      .text-right { text-align: right !important; }
      .text-center { text-align: center !important; }
    </style>
    </head><body>
      <div class="header">
        <div class="header-left">
          <div class="brand">
            ${logoBase64 ? '<img src="' + logoBase64 + '" alt="Logo"/>' : ''}
            <div><h1>${companyName}</h1><p>NIT: ${nit}-${dv} | Régimen Común</p></div>
          </div>
          <p>CL 36 D SUR 27 D 39 AP 1001, Envigado, Colombia</p>
          <p>Tel: +57 (310) 877-7629 | Contacto: twosixmarca@gmail.com</p>
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
          <div class="cell-row"><span class="cell-label">Peticionario:</span> <span class="cell-value">${customer?.name || 'Cliente'}</span></div>
          <div class="cell-row"><span class="cell-label">CC/NIT:</span> <span class="cell-value">${(customer as any)?.document_number || '22222222'}</span></div>
          <div class="cell-row"><span class="cell-label">Celular:</span> <span class="cell-value">${customer?.current_phone_number || 'N/A'}</span></div>
          <div class="cell-row"><span class="cell-label">Correo:</span> <span class="cell-value">${customer?.email || ''}</span></div>
          <div class="cell-row"><span class="cell-label">Dirección:</span> <span class="cell-value">${order?.shipping_address || ''}</span></div>
        </div>
        <div class="cell" style="width: 60%">
          <div class="cell-title">Datos Regulares de la Factura</div>
          <div style="display: flex; gap: 10px;">
            <div style="flex: 1;">
              <div class="cell-row"><span class="cell-label">Fecha Emisión:</span> <span class="cell-value">${invoice.issue_date.toLocaleString('es-CO')}</span></div>
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
            <th class="text-center">#</th>
            <th>Cód / Descripción</th>
            <th class="text-center">Cant.</th>
            <th class="text-center">U/M</th>
            <th class="text-right">Unitario</th>
            <th class="text-center">Imp (%)</th>
            <th class="text-right">Imp ($)</th>
            <th class="text-right">Valor Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      <div class="totals-wrapper">
        <div class="observations">
          <strong>OBSERVACIONES DE LA FACTURA:</strong><br><br>
          Grandes contribuyentes. Somos retenedores de IVA. Responsables de IVA según normatividad vigente.<br>
          ${resText}<br><br>
        </div>
        <table class="totals-table">
          <tr><td>Subtotal Bruto</td><td class="text-right">${formatCOP(subtotal)}</td></tr>
          <tr><td>Impuestos COP (IVA)</td><td class="text-right">${formatCOP(iva)}</td></tr>
          <tr><td>Gastos de Envío</td><td class="text-right">${formatCOP(shipping)}</td></tr>
          <tr class="total-row"><td>TOTAL A PAGAR COP</td><td class="text-right">${formatCOP(total)}</td></tr>
        </table>
      </div>
      <div class="footer-norm">
        <div class="cufe-box">CUFE / CUDE: ${invoice.cufe_code || 'N/A'}</div>
        <p>Proveedor Tecnológico: TWO SIX S.A.S. - NIT: ${nit}-${dv} | Representación Gráfica de Factura Electrónica De Venta</p>
      </div>
      <div class="signatures">
        <div class="signature-box">Firma Digital Integrada...</div>
        ${qrImg ? '<div class="qr-box"><img src="' + qrImg + '" style="width: 80px; height: 80px;" alt="QR"/></div>' : ''}
      </div>
    </body></html>`;

    const htmlPdfNode = require('html-pdf-node');
    return await htmlPdfNode.generatePdf(
      { content: html },
      { format: 'A4', margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }, args: ['--no-sandbox'] }
    );
  }
}
