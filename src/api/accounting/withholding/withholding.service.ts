import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class WithholdingService {
  constructor(
    private prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: { year?: string; provider?: string; concept?: string }) {
    const where: any = {};

    if (query.year) {
      where.year = parseInt(query.year, 10);
    }

    if (query.provider) {
      where.id_provider = query.provider;
    }

    if (query.concept) {
      where.concept = query.concept;
    }

    return this.prisma.withholdingCertificate.findMany({
      where,
      include: { provider: true },
      orderBy: { certificate_number: 'asc' },
    });
  }

  async findOne(id: number) {
    const certificate = await this.prisma.withholdingCertificate.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    return certificate;
  }

  async generateFromExpenses(year: number) {
    // Query all expenses with retention_amount > 0 for the given year
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const expenses = await this.prisma.expense.findMany({
      where: {
        retention_amount: { gt: 0 },
        expense_date: { gte: startDate, lte: endDate },
        id_provider: { not: null },
      },
      include: { provider: true },
    });

    if (expenses.length === 0) {
      return { message: 'No se encontraron gastos con retenciones para el año indicado', created: 0 };
    }

    // Group by provider + concept (RETEFUENTE as default since expenses only have retention_amount)
    const grouped = new Map<string, { id_provider: string; concept: string; base_amount: number; withheld_amount: number }>();

    for (const exp of expenses) {
      const key = `${exp.id_provider}_RETEFUENTE`;
      const existing = grouped.get(key);
      if (existing) {
        existing.base_amount += exp.subtotal;
        existing.withheld_amount += exp.retention_amount;
      } else {
        grouped.set(key, {
          id_provider: exp.id_provider!,
          concept: 'RETEFUENTE',
          base_amount: exp.subtotal,
          withheld_amount: exp.retention_amount,
        });
      }
    }

    // Delete existing certificates for this year to regenerate
    await this.prisma.withholdingCertificate.deleteMany({
      where: { year },
    });

    // Get sequential numbering: CR-YYYY-0001
    let seq = 1;
    const created: any[] = [];

    for (const [, data] of grouped) {
      const certNumber = `CR-${year}-${String(seq).padStart(4, '0')}`;
      const rate = data.base_amount > 0 ? (data.withheld_amount / data.base_amount) * 100 : 0;

      const cert = await this.prisma.withholdingCertificate.create({
        data: {
          certificate_number: certNumber,
          id_provider: data.id_provider,
          year,
          concept: data.concept,
          base_amount: Math.round(data.base_amount),
          rate: Math.round(rate * 100) / 100,
          withheld_amount: Math.round(data.withheld_amount),
          issue_date: new Date(),
        },
        include: { provider: true },
      });

      created.push(cert);
      seq++;
    }

    return { message: `Se generaron ${created.length} certificados para el año ${year}`, created: created.length, certificates: created };
  }

  async generatePdf(id: number): Promise<Buffer> {
    const certificate = await this.prisma.withholdingCertificate.findUnique({
      where: { id },
      include: { provider: true },
    });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    const nit = this.configService.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.configService.get<string>('DIAN_COMPANY_DV') || '';
    const companyName = this.configService.get<string>('DIAN_COMPANY_NAME') || 'TWO SIX S.A.S.';

    const formatCOP = (n: number) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(n);

    const conceptLabels: Record<string, string> = {
      RETEFUENTE: 'Retenci\u00f3n en la Fuente',
      RETEICA: 'Retenci\u00f3n de ICA',
      RETEIVA: 'Retenci\u00f3n de IVA',
    };

    const conceptLabel = conceptLabels[certificate.concept] || certificate.concept;

    const html = `
    <!DOCTYPE html>
    <html><head><meta charset="utf-8"><title>Certificado ${certificate.certificate_number}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Inter', sans-serif; margin: 0; padding: 0; font-size: 10px; color: #1e293b; background: #fff; }

      .page { max-width: 800px; margin: 0 auto; }

      .hdr { background: linear-gradient(135deg, #131313 0%, #1a1a1a 40%, #222222 100%); padding: 28px 36px 22px; position: relative; }
      .hdr::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #b8962e, #d4af37, #f5d76e, #d4af37, #b8962e); }
      .hdr-title { font-size: 20px; font-weight: 800; color: #d4af37; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 4px; }
      .hdr-sub { font-size: 11px; color: #999; }
      .hdr-num { font-size: 16px; color: #fff; font-weight: 700; margin-top: 8px; }

      .body { padding: 30px 36px; }

      .section-title { font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; border-bottom: 2px solid #d4af37; padding-bottom: 6px; margin-bottom: 14px; margin-top: 24px; }

      .info-grid { display: flex; gap: 20px; margin-bottom: 20px; }
      .info-box { flex: 1; border: 1px solid #e2e8f0; border-left: 4px solid #d4af37; border-radius: 0 6px 6px 0; padding: 14px 16px; background: #fafaf8; }
      .info-box h4 { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 10px; }
      .info-row { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f1f1ef; font-size: 10px; }
      .info-row:last-child { border-bottom: none; }
      .info-row .lbl { color: #64748b; font-weight: 600; }
      .info-row .val { color: #0f172a; font-weight: 700; text-align: right; }

      .cert-table { width: 100%; border-collapse: collapse; margin-top: 14px; border: 2px solid #d4af37; border-radius: 8px; overflow: hidden; }
      .cert-table thead th { background: linear-gradient(135deg, #131313, #222); color: #d4af37; padding: 10px 14px; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; text-align: left; }
      .cert-table tbody td { padding: 10px 14px; font-size: 11px; color: #1e293b; border-bottom: 1px solid #f0ebe0; font-weight: 500; }
      .cert-table tbody tr:nth-child(even) td { background: #fdfcf8; }
      .text-right { text-align: right !important; }

      .total-row { display: flex; justify-content: flex-end; margin-top: 16px; }
      .total-box { border: 2px solid #d4af37; border-radius: 8px; overflow: hidden; min-width: 300px; }
      .total-line { display: flex; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid #f0ebe0; }
      .total-line .tl { font-size: 10px; color: #64748b; font-weight: 600; }
      .total-line .tv { font-size: 12px; color: #0f172a; font-weight: 700; }
      .total-grand { display: flex; justify-content: space-between; padding: 12px 16px; background: linear-gradient(135deg, #d4af37, #f5d76e, #d4af37); }
      .total-grand .tl { font-size: 11px; color: #0f172a; font-weight: 800; text-transform: uppercase; }
      .total-grand .tv { font-size: 16px; color: #0f172a; font-weight: 800; }

      .legal { margin-top: 30px; padding: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 9px; color: #64748b; line-height: 1.6; }

      .footer { background: linear-gradient(135deg, #131313, #222); padding: 18px 36px; margin-top: 30px; color: #94a3b8; font-size: 8px; line-height: 1.6; }
      .footer b { color: #d4af37; }
    </style>
    </head><body>
      <div class="page">

        <div class="hdr">
          <div class="hdr-title">Certificado de ${conceptLabel}</div>
          <div class="hdr-sub">${companyName} | NIT: ${nit}-${dv}</div>
          <div class="hdr-num">${certificate.certificate_number}</div>
        </div>

        <div class="body">

          <div class="section-title">Datos del Agente Retenedor</div>
          <div class="info-grid">
            <div class="info-box">
              <h4>Empresa</h4>
              <div class="info-row"><span class="lbl">Raz\u00f3n Social</span><span class="val">${companyName}</span></div>
              <div class="info-row"><span class="lbl">NIT</span><span class="val">${nit}-${dv}</span></div>
              <div class="info-row"><span class="lbl">Direcci\u00f3n</span><span class="val">CL 36 D SUR 27 D 39, Envigado</span></div>
              <div class="info-row"><span class="lbl">Tel\u00e9fono</span><span class="val">+57 (310) 877-7629</span></div>
            </div>
          </div>

          <div class="section-title">Datos del Sujeto de Retenci\u00f3n</div>
          <div class="info-grid">
            <div class="info-box">
              <h4>Proveedor</h4>
              <div class="info-row"><span class="lbl">Raz\u00f3n Social</span><span class="val">${certificate.provider.company_name}</span></div>
              <div class="info-row"><span class="lbl">NIT</span><span class="val">${certificate.provider.id}</span></div>
              <div class="info-row"><span class="lbl">Tel\u00e9fono</span><span class="val">${certificate.provider.phone}</span></div>
              <div class="info-row"><span class="lbl">Email</span><span class="val">${certificate.provider.email}</span></div>
            </div>
          </div>

          <div class="section-title">Detalle de la Retenci\u00f3n - A\u00f1o Gravable ${certificate.year}</div>

          <table class="cert-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th class="text-right">Base Gravable</th>
                <th class="text-right">Tarifa (%)</th>
                <th class="text-right">Valor Retenido</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${conceptLabel}</td>
                <td class="text-right">${formatCOP(certificate.base_amount)}</td>
                <td class="text-right">${certificate.rate}%</td>
                <td class="text-right">${formatCOP(certificate.withheld_amount)}</td>
              </tr>
            </tbody>
          </table>

          <div class="total-row">
            <div class="total-box">
              <div class="total-line"><span class="tl">Base Gravable Total</span><span class="tv">${formatCOP(certificate.base_amount)}</span></div>
              <div class="total-line"><span class="tl">Tarifa Aplicada</span><span class="tv">${certificate.rate}%</span></div>
              <div class="total-grand"><span class="tl">Total Retenido</span><span class="tv">${formatCOP(certificate.withheld_amount)}</span></div>
            </div>
          </div>

          <div class="legal">
            <strong>Nota legal:</strong> Este certificado se expide de conformidad con lo dispuesto en el Art\u00edculo 381 del Estatuto Tributario de Colombia.
            El presente certificado corresponde a las retenciones practicadas durante el a\u00f1o gravable ${certificate.year}.
            <br><br>
            <strong>Fecha de expedici\u00f3n:</strong> ${certificate.issue_date.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

        </div>

        <div class="footer">
          <b>${companyName}</b> | NIT: ${nit}-${dv} | CL 36 D SUR 27 D 39, Envigado, Colombia<br>
          Tel: +57 (310) 877-7629 | twosixfacturaelectronica@gmail.com | twosixweb.com
        </div>

      </div>
    </body></html>`;

    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfUint8 = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
    });
    await browser.close();

    return Buffer.from(pdfUint8);
  }

  async remove(id: number) {
    const certificate = await this.prisma.withholdingCertificate.findUnique({ where: { id } });

    if (!certificate) {
      throw new NotFoundException(`Certificado con ID ${id} no encontrado`);
    }

    return this.prisma.withholdingCertificate.delete({ where: { id } });
  }
}
