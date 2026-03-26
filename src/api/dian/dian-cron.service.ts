import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianEmailService } from './dian-email.service';

@Injectable()
export class DianCronService {
  private readonly logger = new Logger(DianCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly soapService: DianSoapService,
    private readonly emailService: DianEmailService,
  ) {}

  @Cron('0 * * * * *') // Every minute at second 0
  async pollDianInvoices() {
    this.logger.debug('Ejecutando polling de facturas DIAN (SENT -> AUTHORIZED)...');

    const pendingInvoices = await this.prisma.dianEInvoicing.findMany({
      where: {
        OR: [
          { status: 'SENT', environment: 'TEST' },
          { status: 'AUTHORIZED', email_sent: false }
        ]
      },
    });

    for (const invoice of pendingInvoices) {
      if (invoice.status === 'AUTHORIZED' && invoice.email_sent === false) {
        try {
          this.logger.debug(`Retrying email for AUTHORIZED invoice ${invoice.document_number}`);
          await this.emailService.sendDianInvoiceEmail(invoice.id);
        } catch (error) {
           this.logger.error(`Error retrying email for Factura ${invoice.id}:`, error);
        }
        continue;
      }

      if (!invoice.dian_response) continue;

      try {
        const zipKeyMatch = invoice.dian_response.match(/<b:ZipKey>(.*?)<\/b:ZipKey>/);
        if (!zipKeyMatch) continue;

        const trackId = zipKeyMatch[1];
        const rawResponse = await this.soapService.getStatusZip(trackId);

        const xmlBase64Bytes = rawResponse.match(/<b:XmlBase64Bytes>(.*?)<\/b:XmlBase64Bytes>/s)?.[1];
        const isValid = rawResponse.match(/<b:IsValid>(.*?)<\/b:IsValid>/)?.[1] === 'true';
        const statusCode = rawResponse.match(/<b:StatusCode>(.*?)<\/b:StatusCode>/)?.[1] || 'UNKNOWN';
        const statusDescription = rawResponse.match(/<b:StatusDescription>(.*?)<\/b:StatusDescription>/)?.[1] || '';

        let newStatus = invoice.status;
        if (isValid && statusCode === '00') {
          newStatus = 'AUTHORIZED';
        } else if (!isValid && statusCode === '2') {
          newStatus = 'AUTHORIZED'; // En Sandbox, '2' indica Set de Pruebas Aceptado
        } else if (!isValid && parseInt(statusCode, 10) >= 60) {
          newStatus = 'REJECTED';
        } else if (statusCode !== 'UNKNOWN') {
           newStatus = 'PROCESSED';
           this.logger.debug(`Factura ${invoice.document_number} procesada pero no autorizada aún (Estado: ${statusCode}).`);
        } else if (statusCode === 'UNKNOWN') {
           // Si sigue pending
        }

        if (newStatus !== invoice.status) {
          await this.prisma.dianEInvoicing.update({
            where: { id: invoice.id },
            data: {
              status: newStatus,
              dian_response: rawResponse,
              ...(xmlBase64Bytes ? { dian_zip_base64: xmlBase64Bytes } : {}),
              ...(newStatus === 'AUTHORIZED' ? { dian_authorized_at: new Date() } : {}),
            },
          });
          this.logger.log(`Factura ${invoice.document_number} actualizada a ${newStatus} por Cron Job.`);

          // Si pasó a autorizado y aún no se envía correo, despacharlo
          if (newStatus === 'AUTHORIZED' && !invoice.email_sent) {
            await this.emailService.sendDianInvoiceEmail(invoice.id);
          }
        }
      } catch (error) {
        this.logger.error(`Error en cron polling Factura ${invoice.id}:`, error);
      }
    }
  }
}
