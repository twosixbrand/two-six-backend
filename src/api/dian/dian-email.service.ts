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
      this.logger.warn(
        'Faltan variables DIAN_EMAIL_USER / PASSWORD / HOST en .env. El correo DIAN no saldrá.',
      );
    }
  }

  async sendDianInvoiceEmail(invoiceId: number): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error(
        'No se configuró el transportador DIAN_EMAIL_. Abortando envío.',
      );
      return false;
    }

    const invoice = await this.prisma.dianEInvoicing.findUnique({
      where: { id: invoiceId },
      include: { order: { include: { customer: true, orderItems: true } } },
    });

    if (!invoice) {
      this.logger.error(`Factura ${invoiceId} no encontrada.`);
      return false;
    }

    // Snapshot manual (regularización sin Order). Si existe, es fuente alterna
    // de cliente/ítems cuando no hay Order asociada.
    let manualSnapshot: any = null;
    if (invoice.manual_invoice_snapshot) {
      try {
        manualSnapshot =
          typeof invoice.manual_invoice_snapshot === 'string'
            ? JSON.parse(invoice.manual_invoice_snapshot)
            : invoice.manual_invoice_snapshot;
      } catch (err) {
        this.logger.warn(
          `manual_invoice_snapshot inválido en factura ${invoice.document_number}: ${err.message}`,
        );
      }
    }

    const hasOrderCustomer = !!(invoice.order && invoice.order.customer);
    if (!hasOrderCustomer && !manualSnapshot?.customer?.email) {
      this.logger.warn(
        `Factura ${invoice.document_number}: sin Order ni snapshot con email. Se omite envío.`,
      );
      return false;
    }

    if (invoice.email_sent) {
      this.logger.warn(
        `El correo de la Factura ${invoice.document_number} ya fue enviado previamente.`,
      );
      return true; // Si ya se envió, evitamos reenviar
    }

    try {
      this.logger.log(
        `Generando archivos (XML y PDF) para la factura ${invoice.document_number}...`,
      );

      // 1. Reconstruir UBL XML y Firmarlo
      const resolution =
        (await this.prisma.dianResolution.findFirst({
          where: { id: invoice.id_dian_resolution || 0 },
        })) ||
        (await this.prisma.dianResolution.findFirst({
          where: {
            isActive: true,
            environment: invoice.environment as any,
            type: 'INVOICE',
          },
        }));

      const invoiceDto: InvoiceDto = manualSnapshot
        ? {
            number: invoice.document_number,
            date: invoice.issue_date.toISOString().split('T')[0],
            time: '12:00:00-05:00',
            customerName: manualSnapshot.customer.name,
            customerDoc: manualSnapshot.customer.doc_number,
            customerDocType: manualSnapshot.customer.doc_type,
            resolutionPrefix: resolution?.prefix,
            resolutionNumber: resolution?.resolutionNumber,
            resolutionStartDate: resolution?.startDate
              .toISOString()
              .split('T')[0],
            resolutionEndDate: resolution?.endDate.toISOString().split('T')[0],
            resolutionStartNumber: resolution?.startNumber,
            resolutionEndNumber: resolution?.endNumber,
          }
        : {
            number: invoice.document_number,
            date: invoice.issue_date.toISOString().split('T')[0],
            time: '12:00:00-05:00',
            customerName: invoice.order!.customer.name,
            customerDoc:
              (invoice.order!.customer as any).document_number ||
              (invoice.order!.customer as any).identification_number ||
              '222222222222',
            customerDocType:
              String(invoice.order!.customer.id_identification_type) || '13',
            resolutionPrefix: resolution?.prefix,
            resolutionNumber: resolution?.resolutionNumber,
            resolutionStartDate: resolution?.startDate
              .toISOString()
              .split('T')[0],
            resolutionEndDate: resolution?.endDate.toISOString().split('T')[0],
            resolutionStartNumber: resolution?.startNumber,
            resolutionEndNumber: resolution?.endNumber,
          };

      const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
      const xmlWithCufe = xmlBase.replace(
        /CUFE_PLACEHOLDER/g,
        invoice.cufe_code || '',
      );
      const signedXml = this.signerService.signXml(xmlWithCufe);

      // 2. Generar PDF (Usando DianPdfService unificado)
      const pdfBuffer = await this.pdfService.generateInvoicePdf(
        invoice,
        resolution,
      );

      // 3. Crear el archivo ZIP (Normativa DIAN)
      const zip = new AdmZip();
      zip.addFile(
        `Factura_${invoice.document_number}.xml`,
        Buffer.from(signedXml, 'utf-8'),
      );
      zip.addFile(`Factura_${invoice.document_number}.pdf`, pdfBuffer);
      const zipBuffer = zip.toBuffer();

      const customerEmail =
        manualSnapshot?.customer?.email || invoice.order?.customer?.email;
      const dianSender =
        this.configService.get<string>('DIAN_EMAIL_USER') ||
        'twosixfacturaelectronica@gmail.com';
      const companyName =
        this.configService.get<string>('DIAN_COMPANY_NAME') || 'TWO SIX S.A.S.';

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
             <p>Estimado/a <strong>${manualSnapshot?.customer?.name || invoice.order?.customer?.name || 'cliente'}</strong>,</p>
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
          },
        ],
      };

      this.logger.log(
        `Enviando factura electrónica (ZIP) a ${customerEmail}...`,
      );
      await this.transporter.sendMail(mailOptions);
      this.logger.log(
        `Correo Legal DIAN enviado exitosamente para ${invoice.document_number}.`,
      );

      // Marcar como enviado
      await this.prisma.dianEInvoicing.update({
        where: { id: invoiceId },
        data: { email_sent: true },
      });

      return true;
    } catch (err) {
      this.logger.error(
        `Error despachando el correo DIAN para factura ${invoiceId}: ${err.message}`,
      );
      return false;
    }
  }

  // generatePdfBuffer eliminado — ahora centralizado en DianPdfService.generateInvoicePdf()
}
