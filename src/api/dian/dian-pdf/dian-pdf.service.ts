import { Injectable, Logger } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class DianPdfService {
  private readonly logger = new Logger(DianPdfService.name);

  async generateQrBase64(cufe: string, nit: string, valFac: string, valIva: string, valTot: string, fecha: string): Promise<string> {
    // URL de consulta DIAN — esto es lo que debe codificar el QR
    const url = `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=${cufe}`;

    try {
      return await QRCode.toDataURL(url, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
    } catch (error) {
      this.logger.error(`Error generando Código QR: ${error.message}`);
      return '';
    }
  }

  /**
   * Genera el buffer del PDF resultante que mezcla los detalles de Two Six y el Código QR de la DIAN.
   * Esto requerirá herramientas como PDFKit, html-pdf-node o Puppeteer para pintar los estilos de la factura premium.
   */
  async generateInvoicePdf(invoiceData: any, qrCodeBase64: string): Promise<Buffer> {
    // TODO: Retornar rendering HTML to PDF
    return Buffer.from('PDF FACTURA DE VENTA - Representación Gráfica. QR=' + qrCodeBase64.substring(0,20) + '...');
  }
}
