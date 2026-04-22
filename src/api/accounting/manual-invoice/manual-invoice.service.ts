import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { DianUblService, InvoiceDto } from '../../dian/dian-ubl/dian-ubl.service';
import { DianSignerService } from '../../dian/dian-signer/dian-signer.service';
import { DianCufeService } from '../../dian/dian-cufe/dian-cufe.service';
import { DianSoapService } from '../../dian/dian-soap/dian-soap.service';
import { DianPdfService } from '../../dian/dian-pdf/dian-pdf.service';
import { JournalService } from '../journal/journal.service';
import { ClosingService } from '../closing/closing.service';
import { CashReceiptService } from '../cash-receipt/cash-receipt.service';
import { CreateManualInvoiceDto } from './dto/create-manual-invoice.dto';

type ListFilters = {
  startDate?: string;
  endDate?: string;
  status?: string;
  search?: string;
};

@Injectable()
export class ManualInvoiceService {
  private readonly logger = new Logger(ManualInvoiceService.name);

  async list(filters: ListFilters = {}) {
    const where: any = { cash_receipt_journal_id: { not: null } };
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.issue_date = {};
      if (filters.startDate) where.issue_date.gte = new Date(filters.startDate);
      if (filters.endDate) where.issue_date.lte = new Date(filters.endDate);
    }

    const invoices = await this.prisma.dianEInvoicing.findMany({
      where,
      include: {
        cashReceiptJournal: {
          select: { id: true, entry_number: true, entry_date: true, description: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const manualEntries = await this.prisma.journalEntry.findMany({
      where: {
        source_type: 'MANUAL_DIAN_INVOICE',
        source_id: { in: invoices.map((i) => i.id) },
      },
      select: { id: true, entry_number: true, source_id: true },
    });
    const entryByInvoice = new Map<number, { id: number; entry_number: string }>();
    for (const e of manualEntries) {
      if (e.source_id) entryByInvoice.set(e.source_id, { id: e.id, entry_number: e.entry_number });
    }

    const rows = invoices.map((inv) => {
      let snapshot: any = null;
      if (inv.manual_invoice_snapshot) {
        try {
          snapshot = JSON.parse(inv.manual_invoice_snapshot);
        } catch {
          snapshot = null;
        }
      }
      return {
        id: inv.id,
        document_number: inv.document_number,
        cufe_code: inv.cufe_code,
        issue_date: inv.issue_date,
        status: inv.status,
        environment: inv.environment,
        email_sent: inv.email_sent,
        url_pdf: inv.url_pdf,
        url_xml: inv.url_xml,
        dian_authorized_at: inv.dian_authorized_at,
        customer: snapshot?.customer ?? null,
        operation_date: snapshot?.operation_date ?? null,
        subtotal: snapshot?.subtotal ?? null,
        iva_total: snapshot?.iva_total ?? null,
        total: snapshot?.total ?? null,
        notes: snapshot?.notes ?? null,
        items_count: Array.isArray(snapshot?.items) ? snapshot.items.length : 0,
        cash_receipt: inv.cashReceiptJournal
          ? {
              id: inv.cashReceiptJournal.id,
              entry_number: inv.cashReceiptJournal.entry_number,
              entry_date: inv.cashReceiptJournal.entry_date,
            }
          : null,
        journal_entry: entryByInvoice.get(inv.id) ?? null,
      };
    });

    if (filters.search) {
      const q = filters.search.toLowerCase();
      return rows.filter(
        (r) =>
          r.document_number.toLowerCase().includes(q) ||
          r.customer?.name?.toLowerCase().includes(q) ||
          r.customer?.doc_number?.toLowerCase().includes(q),
      );
    }
    return rows;
  }

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly ublService: DianUblService,
    private readonly signerService: DianSignerService,
    private readonly cufeService: DianCufeService,
    private readonly soapService: DianSoapService,
    private readonly pdfService: DianPdfService,
    private readonly journalService: JournalService,
    private readonly closingService: ClosingService,
    private readonly cashReceiptService: CashReceiptService,
  ) {}

  /**
   * Emite una Factura Electrónica DIAN retroactiva cruzando el saldo de un
   * anticipo registrado previamente en un Recibo de Caja.
   *
   * - La DIAN recibe la factura con issue_date = hoy (exige resolución vigente).
   * - El JournalEntry se registra con entry_date = operation_date (fecha real
   *   de la venta), lo que permite respetar el cierre contable y el flujo
   *   solicitado por la contadora.
   *
   * Asiento generado:
   *   DB <advance_puc_code>  total_operacion  (ej: 280505 Anticipos Clientes)
   *   CR <revenue_puc_code>  subtotal         (ej: 413524 Venta Prendas)
   *   CR <iva_puc_code>      iva              (ej: 240801 IVA Generado)
   */
  async createManualInvoice(dto: CreateManualInvoiceDto) {
    const operationDate = new Date(dto.operation_date);
    const isClosed = await this.closingService.isPeriodClosed(operationDate);
    if (isClosed) {
      throw new ForbiddenException(
        'No se puede emitir la factura: el período contable de la fecha de operación está cerrado.',
      );
    }

    const [advanceAccount, revenueAccount, ivaAccount] = await Promise.all([
      this.prisma.pucAccount.findUnique({ where: { code: dto.advance_puc_code } }),
      this.prisma.pucAccount.findUnique({ where: { code: dto.revenue_puc_code } }),
      this.prisma.pucAccount.findUnique({ where: { code: dto.iva_puc_code } }),
    ]);
    if (!advanceAccount) throw new NotFoundException(`Cuenta PUC anticipo ${dto.advance_puc_code} no existe.`);
    if (!revenueAccount) throw new NotFoundException(`Cuenta PUC ingresos ${dto.revenue_puc_code} no existe.`);
    if (!ivaAccount) throw new NotFoundException(`Cuenta PUC IVA ${dto.iva_puc_code} no existe.`);
    for (const acc of [advanceAccount, revenueAccount, ivaAccount]) {
      if (!acc.accepts_movements) {
        throw new BadRequestException(
          `La cuenta ${acc.code} - ${acc.name} es mayor y no acepta movimientos.`,
        );
      }
    }

    // Totales
    let subtotal = 0;
    let ivaTotal = 0;
    const enrichedLines = dto.items.map((item) => {
      const unit = Number(item.unit_price.toFixed(2));
      const lineSubtotal = Number((item.quantity * unit).toFixed(2));
      const rate = item.iva_rate ?? 19;
      const lineIva = Number((lineSubtotal * (rate / 100)).toFixed(2));
      subtotal += lineSubtotal;
      ivaTotal += lineIva;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: unit,
        taxPercent: rate,
        lineSubtotal,
        lineIva,
      };
    });
    subtotal = Number(subtotal.toFixed(2));
    ivaTotal = Number(ivaTotal.toFixed(2));
    const total = Number((subtotal + ivaTotal).toFixed(2));

    const available = await this.cashReceiptService.getAvailableBalance(
      dto.cash_receipt_journal_id,
      dto.advance_puc_code,
    );
    if (total > available + 0.01) {
      throw new BadRequestException(
        `El total de la factura (${total}) supera el saldo disponible del anticipo (${available}).`,
      );
    }

    const env = this.configService.get<string>('DIAN_ENVIRONMENT', 'TEST');
    const resolution = await this.prisma.dianResolution.findFirst({
      where: { isActive: true, environment: env, type: 'INVOICE' },
    });
    if (!resolution) {
      throw new BadRequestException('No hay resolución DIAN activa para facturas.');
    }
    if (resolution.currentNumber >= resolution.endNumber) {
      throw new BadRequestException('Se agotó el rango de numeración DIAN.');
    }

    const nextNumber = resolution.currentNumber + 1;
    await this.prisma.dianResolution.update({
      where: { id: resolution.id },
      data: { currentNumber: nextNumber },
    });
    const invoiceNumber = `${resolution.prefix}${nextNumber}`;

    const issueDate = new Date().toISOString().split('T')[0];
    const issueTime = '12:00:00-05:00';
    const operationNote = `Operación económica original: ${dto.operation_date}. Cruza anticipo recibido (recibo de caja journal #${dto.cash_receipt_journal_id}).`;

    const invoiceDto: InvoiceDto = {
      number: invoiceNumber,
      date: issueDate,
      time: issueTime,
      customerName: dto.customer.name,
      customerDoc: dto.customer.doc_number,
      customerDocType: dto.customer.doc_type,
      customerEmail: (dto.customer as any).email,
      customerAddress: (dto.customer as any).address,
      customerCity: (dto.customer as any).city,
      lines: enrichedLines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice,
        taxPercent: l.taxPercent,
      })),
      subtotal,
      taxTotal: ivaTotal,
      total,
      notes: [operationNote, dto.notes].filter(Boolean).join(' | '),
      resolutionPrefix: resolution.prefix,
      resolutionNumber: resolution.resolutionNumber,
      resolutionStartDate: resolution.startDate.toISOString().split('T')[0],
      resolutionEndDate: resolution.endDate.toISOString().split('T')[0],
      resolutionStartNumber: resolution.startNumber,
      resolutionEndNumber: resolution.endNumber,
    } as InvoiceDto;

    const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
    const claveTecnica = resolution.technicalKey || this.configService.get<string>('DIAN_TECHNICAL_KEY') || '';

    const cufe = this.cufeService.generateCufe({
      NumFac: invoiceDto.number,
      FecFac: invoiceDto.date,
      HorFac: invoiceDto.time,
      ValFac: subtotal.toFixed(2),
      CodImp1: '01',
      ValImp1: ivaTotal.toFixed(2),
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

    const soapResponse = await this.soapService.sendInvoice(Buffer.from(signedXml), invoiceDto.number);

    const qrBase64 = await this.pdfService.generateQrBase64(
      cufe,
      nit,
      subtotal.toFixed(2),
      ivaTotal.toFixed(2),
      total.toFixed(2),
      invoiceDto.date,
    );

    const snapshot = {
      customer: {
        doc_type: dto.customer.doc_type,
        doc_number: dto.customer.doc_number,
        name: dto.customer.name,
        email: dto.customer.email ?? null,
        address: dto.customer.address ?? null,
        city: dto.customer.city ?? null,
      },
      items: enrichedLines.map((l) => ({
        description: l.description,
        quantity: l.quantity,
        unit_price: l.unitPrice,
        iva_rate: l.taxPercent,
        line_subtotal: l.lineSubtotal,
        line_iva: l.lineIva,
      })),
      subtotal,
      iva_total: ivaTotal,
      total,
      operation_date: dto.operation_date,
      notes: dto.notes ?? null,
    };

    const savedInvoice = await this.prisma.dianEInvoicing.create({
      data: {
        document_number: invoiceDto.number,
        cufe_code: cufe,
        qr_code: qrBase64,
        issue_date: new Date(),
        due_date: new Date(),
        status: 'SENT',
        dian_response: typeof soapResponse === 'string' ? soapResponse : JSON.stringify(soapResponse),
        environment: env,
        id_dian_resolution: resolution.id,
        cash_receipt_journal_id: dto.cash_receipt_journal_id,
        manual_invoice_snapshot: JSON.stringify(snapshot),
      },
    });

    const journalEntry = await this.journalService.create({
      entry_date: dto.operation_date,
      description: `Factura manual DIAN ${invoiceNumber} - cruce anticipo (${dto.customer.name})`,
      source_type: 'MANUAL_DIAN_INVOICE',
      source_id: savedInvoice.id,
      created_by: dto.created_by,
      metadata: JSON.stringify({
        customer_nit: dto.customer.doc_number,
        customer_name: dto.customer.name,
        customer_email: dto.customer.email ?? null,
        invoice_number: invoiceNumber,
        operation_date: dto.operation_date,
        notes: dto.notes ?? null,
      }),
      lines: [
        {
          id_puc_account: advanceAccount.id,
          description: `Cruce anticipo ${dto.customer.name}`,
          debit: total,
          credit: 0,
        },
        {
          id_puc_account: revenueAccount.id,
          description: `Ingreso venta - ${dto.customer.name}`,
          debit: 0,
          credit: subtotal,
        },
        {
          id_puc_account: ivaAccount.id,
          description: `IVA generado factura ${invoiceNumber}`,
          debit: 0,
          credit: ivaTotal,
        },
      ],
    });

    this.logger.log(`Factura manual ${invoiceNumber} emitida. CUFE=${cufe}. JournalEntry=${journalEntry.id}.`);

    return {
      success: true,
      invoice_id: savedInvoice.id,
      invoice_number: invoiceNumber,
      cufe,
      qr_base64: qrBase64,
      journal_entry_id: journalEntry.id,
      subtotal,
      iva: ivaTotal,
      total,
      dian_response: soapResponse,
    };
  }
}
