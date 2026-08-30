import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DianUblService, InvoiceDto } from './dian-ubl/dian-ubl.service';
import { DianSignerService } from './dian-signer/dian-signer.service';
import { DianCufeService } from './dian-cufe/dian-cufe.service';
import { DianSoapService } from './dian-soap/dian-soap.service';
import { DianPdfService } from './dian-pdf/dian-pdf.service';

@Injectable()
export class DianOrchestratorService {
  private readonly logger = new Logger(DianOrchestratorService.name);

  constructor(
    private readonly ublService: DianUblService,
    private readonly signerService: DianSignerService,
    private readonly cufeService: DianCufeService,
    private readonly soapService: DianSoapService,
    private readonly pdfService: DianPdfService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Genera y envía una factura electrónica a la DIAN.
   */
  async generateAndSendInvoice(body: any): Promise<any> {
    const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');

    // Obtener siguiente número consecutivo de la resolución activa
    const resolution = await this.prisma.dianResolution.findFirst({
      where: { isActive: true, environment: env, type: 'INVOICE' },
    });
    if (!resolution)
      throw new Error('No hay resolución DIAN activa configurada');
    if (resolution.currentNumber >= resolution.endNumber)
      throw new Error('Se agotó el rango de numeración DIAN');

    const nextNumber = resolution.currentNumber + 1;
    await this.prisma.dianResolution.update({
      where: { id: resolution.id },
      data: { currentNumber: nextNumber },
    });

    const invoiceNumber = `${resolution.prefix}${nextNumber}`;

    let orderLines = body.lines;
    let customerName = body.customerName;
    let paymentMeansCode = body.paymentMethod;

    if (body.orderId && !orderLines) {
      const order = await this.prisma.order.findUnique({
        where: { id: parseInt(body.orderId, 10) },
        include: { customer: true, orderItems: true },
      });
      if (order) {
        customerName = order.customer?.name || body.customerName;
        orderLines = order.orderItems.map((item) => ({
          description: item.product_name,
          quantity: item.quantity,
          unitPrice: item.unit_price,
          taxPercent: 19,
        }));
        
        if (!paymentMeansCode && order.payment_method) {
          const pmMap: any = {
            WOMPI_FULL: '48',
            WOMPI_COD: '10',
            PSE: '49',
            CASH: '10',
            TRANSFER: '31',
          };
          paymentMeansCode = pmMap[order.payment_method] || '10';
        }
      }
    }

    const invoiceDto: InvoiceDto = {
      number: invoiceNumber,
      date: body.date || new Date().toISOString().split('T')[0],
      time: body.time || '12:00:00-05:00',
      customerName: customerName || 'Consumidor Final',
      customerDoc: body.customerDoc || '222222222222',
      customerDocType: body.customerDocType || '13',
      lines: orderLines,
      paymentMeansCode: paymentMeansCode || '10',

      resolutionPrefix: resolution.prefix,
      resolutionNumber: resolution.resolutionNumber,
      resolutionStartDate: resolution.startDate.toISOString().split('T')[0],
      resolutionEndDate: resolution.endDate.toISOString().split('T')[0],
      resolutionStartNumber: resolution.startNumber,
      resolutionEndNumber: resolution.endNumber,
    };

    this.logger.log(`Generando Factura Electrónica: ${invoiceDto.number}`);

    const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
    const claveTecnica =
      resolution.technicalKey ||
      this.configService.get<string>('DIAN_TECHNICAL_KEY') ||
      '';

    const lines = invoiceDto.lines || [
      {
        description: 'Producto',
        quantity: 1,
        unitPrice: 100000,
        taxPercent: 19,
      },
    ];
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
      NumFac: invoiceDto.number,
      FecFac: invoiceDto.date,
      HorFac: invoiceDto.time,
      ValFac: subtotal.toFixed(2),
      CodImp1: '01',
      ValImp1: taxTotal.toFixed(2),
      CodImp2: '04',
      ValImp2: '0.00',
      CodImp3: '03',
      ValImp3: '0.00',
      ValTot: total.toFixed(2),
      NitOfe: nit,
      NumAdq: invoiceDto.customerDoc,
      ClTec: claveTecnica,
      TipoAmb: env === 'TEST' ? '2' : '1',
    });

    const xmlBase = this.ublService.generateInvoiceXml(invoiceDto);
    const xmlWithCufe = xmlBase.replace(/CUFE_PLACEHOLDER/g, cufe);
    const signedXml = this.signerService.signXml(xmlWithCufe);

    const soapResponse = await this.soapService.sendInvoice(
      Buffer.from(signedXml),
      invoiceDto.number,
    );

    const qrBase64 = await this.pdfService.generateQrBase64(
      cufe,
      nit,
      subtotal.toFixed(2),
      taxTotal.toFixed(2),
      total.toFixed(2),
      invoiceDto.date,
    );

    const now = new Date();
    const saved = await this.prisma.dianEInvoicing.create({
      data: {
        document_number: invoiceDto.number,
        cufe_code: cufe,
        qr_code: qrBase64,
        issue_date: now,
        due_date: now,
        status: 'SENT',
        dian_response:
          typeof soapResponse === 'string'
            ? soapResponse
            : JSON.stringify(soapResponse),
        environment: env,
        ...(body.orderId ? { id_order: parseInt(body.orderId, 10) } : {}),
      },
    });

    this.logger.log(`Factura guardada exitosamente en BD con ID: ${saved.id}`);

    return {
      success: true,
      invoiceNumber,
      cufe,
      dianRecordId: saved.id,
      response: soapResponse,
    };
  }
}
