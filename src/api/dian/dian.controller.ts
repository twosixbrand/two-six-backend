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
          if (dataToUpdate.status === 'AUTHORIZED') {
            dataToUpdate.dian_authorized_at = new Date();
          }
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

    const resolution = await this.prisma.dianResolution.findFirst({
      where: { isActive: true, environment: invoice.environment, type: 'INVOICE' }
    });

    const pdfBuffer = await this.pdfService.generateInvoicePdf(invoice, resolution);
    const fileName = invoice.order ? `Factura_${invoice.document_number}_${invoice.order.order_reference}.pdf` : `Factura_${invoice.document_number}.pdf`;

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
      // Usar new Date() para capturar el timestamp real (evita bug de timezone con date-only strings)
      const now = new Date();
      const saved = await this.prisma.dianEInvoicing.create({
        data: {
          document_number: invoiceDto.number,
          cufe_code: cufe,
          qr_code: qrBase64,
          issue_date: now,
          due_date: now,
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

  @Post('support-document/:expenseId')
  @ApiOperation({ summary: 'Generar y enviar Documento Soporte Electrónico para un Gasto' })
  async createSupportDocument(@Param('expenseId') expenseId: string, @Body() body: any) {
    try {
      const expense = await this.prisma.expense.findUnique({
        where: { id: parseInt(expenseId, 10) },
        include: { provider: true }
      });

      if (!expense) throw new Error('El gasto no existe');

      const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');
      const resolution = await this.prisma.dianResolution.findFirst({
        where: { isActive: true, environment: env, type: 'SUPPORT_DOCUMENT' },
      });

      if (!resolution) throw new Error('No hay resolución configurada para Documento Soporte');

      const nextNumber = resolution.currentNumber + 1;
      await this.prisma.dianResolution.update({
        where: { id: resolution.id },
        data: { currentNumber: nextNumber },
      });

      const docNumber = `${resolution.prefix}${nextNumber}`;

      const docDto: InvoiceDto = {
        number: docNumber,
        date: new Date().toISOString().split('T')[0],
        time: '12:00:00-05:00',
        // @ts-ignore
        customerName: expense.provider?.company_name || 'Proveedor',
        // @ts-ignore
        customerDoc: expense.provider?.id || '222222222222',
        customerDocType: '13', // Cédula/NIT
        paymentMeansCode: '10', // Efectivo
        lines: [{ 
          description: expense.description || 'Compra de bienes/servicios', 
          quantity: 1, 
          unitPrice: expense.subtotal 
        }],
        subtotal: expense.subtotal,
        taxTotal: expense.tax_amount,
        total: expense.total,
        // Resolution data
        resolutionPrefix: resolution.prefix,
        resolutionNumber: resolution.resolutionNumber,
        resolutionStartDate: resolution.startDate.toISOString().split('T')[0],
        resolutionEndDate: resolution.endDate.toISOString().split('T')[0],
        resolutionStartNumber: resolution.startNumber,
        resolutionEndNumber: resolution.endNumber,
      };

      const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
      const claveTecnica = resolution.technicalKey || '';

      // 1. Generar CUDS (Código Único de Documento Soporte)
      const cuds = this.cufeService.generateCufe({
        NumFac: docDto.number, FecFac: docDto.date, HorFac: docDto.time,
        ValFac: docDto.subtotal!.toFixed(2), CodImp1: '01', ValImp1: docDto.taxTotal!.toFixed(2),
        CodImp2: '04', ValImp2: '0.00', CodImp3: '03', ValImp3: '0.00',
        ValTot: docDto.total!.toFixed(2), NitOfe: nit, NumAdq: docDto.customerDoc,
        ClTec: claveTecnica, TipoAmb: env === 'TEST' ? '2' : '1'
      });

      // 2. Generar XML Documento Soporte (Tipo 05), luego firmar
      const xmlBase = this.ublService.generateSupportDocumentXml(docDto);
      const xmlWithCuds = xmlBase.replace(/CUDS_PLACEHOLDER/g, cuds);
      const signedXml = this.signerService.signXml(xmlWithCuds);

      // 3. Enviar a DIAN
      const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), docDto.number);

      // 4. Persistir en base de datos
      const saved = await this.prisma.dianEInvoicing.create({
        data: {
          document_number: docDto.number,
          cufe_code: cuds,
          issue_date: new Date(),
          due_date: new Date(),
          status: 'SENT',
          dian_response: typeof soapResponse === 'string' ? soapResponse : JSON.stringify(soapResponse),
          environment: env,
          id_expense: expense.id,
          id_dian_resolution: resolution.id,
        },
      });

      return {
        success: true,
        message: 'Documento Soporte enviado a la DIAN',
        docId: saved.id,
        cuds,
        dianResponse: soapResponse,
      };
    } catch (error) {
      this.logger.error('Error generando Documento Soporte', error);
      throw new HttpException({ error: error.message }, HttpStatus.INTERNAL_SERVER_ERROR);
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
        customerDoc: body.customerDoc || order?.customer?.document_number || '222222222222',
        customerDocType: body.customerDocType || (order?.customer?.id_identification_type ? order.customer.id_identification_type.toString() : '13'),
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

      // Usar new Date() para capturar el timestamp real (evita bug de timezone con date-only strings)
      const now = new Date();
      const saved = await this.prisma.dianEInvoicing.create({
        data: {
          document_number: invoiceDto.number,
          cufe_code: cufe,
          qr_code: qrBase64,
          issue_date: now,
          due_date: now,
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

