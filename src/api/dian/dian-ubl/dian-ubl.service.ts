import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { create } from 'xmlbuilder2';

export interface InvoiceLineDto {
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number; // default 19%
}

export interface InvoiceDto {
  number: string;
  date: string;
  time: string;
  customerName: string;
  customerDoc: string;
  customerDocType: string;
  lines?: InvoiceLineDto[];
  subtotal?: number;
  taxTotal?: number;
  total?: number;
  paymentMeansCode?: string; // 10=Efectivo/COD, 48=Tarjeta crédito
}

@Injectable()
export class DianUblService {
  constructor(private config: ConfigService) {}

  generateInvoiceXml(invoiceObj: InvoiceDto): string {
    const nit = this.config.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.config.get<string>('DIAN_COMPANY_DV') || '';
    const name = this.config.get<string>('DIAN_COMPANY_NAME') || '';
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');

    // Calcular totales desde las líneas o usar valores por defecto
    const lines = invoiceObj.lines && invoiceObj.lines.length > 0
      ? invoiceObj.lines
      : [{ description: 'Producto', quantity: 1, unitPrice: 100000, taxPercent: 19 }];

    const subtotal = invoiceObj.subtotal ?? lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const taxTotal = invoiceObj.taxTotal ?? Math.round(subtotal * 0.19);
    const total = invoiceObj.total ?? subtotal + taxTotal;

    const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
      .ele('Invoice', {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
        'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
        'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
        'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
        'xmlns:xades141': 'http://uri.etsi.org/01903/v1.4.1#',
        'Id': '_0',
      });

    // UBLExtensions (espacio para firma digital)
    doc.ele('ext:UBLExtensions')
      .ele('ext:UBLExtension')
        .ele('ext:ExtensionContent').up()
      .up()
    .up();

    doc.ele('cbc:UBLVersionID').txt('UBL 2.1').up();
    doc.ele('cbc:CustomizationID').txt('10').up();
    doc.ele('cbc:ProfileID').txt('DIAN 2.1').up();
    doc.ele('cbc:ProfileExecutionID').txt(env === 'TEST' ? '2' : '1').up();
    doc.ele('cbc:ID').txt(invoiceObj.number).up();
    doc.ele('cbc:UUID', { schemeID: env === 'TEST' ? '2' : '1', schemeName: 'CUFE-SHA384' }).txt('CUFE_PLACEHOLDER').up();
    doc.ele('cbc:IssueDate').txt(invoiceObj.date).up();
    doc.ele('cbc:IssueTime').txt(invoiceObj.time).up();
    doc.ele('cbc:InvoiceTypeCode').txt('01').up();
    doc.ele('cbc:Note').txt('Factura electrónica de venta').up();
    doc.ele('cbc:DocumentCurrencyCode').txt('COP').up();
    doc.ele('cbc:LineCountNumeric').txt(String(lines.length)).up();

    // Periodo de facturación
    doc.ele('cac:InvoicePeriod')
      .ele('cbc:StartDate').txt(invoiceObj.date).up()
      .ele('cbc:EndDate').txt(invoiceObj.date).up()
      .ele('cbc:DescriptionCode').txt('1').up()
    .up();

    // Emisor (Supplier)
    doc.ele('cac:AccountingSupplierParty')
      .ele('cbc:AdditionalAccountID').txt('1').up()
      .ele('cac:Party')
        .ele('cac:PartyName')
          .ele('cbc:Name').txt(name).up()
        .up()
        .ele('cac:PhysicalLocation')
          .ele('cac:Address')
            .ele('cbc:ID').txt('05266').up()
            .ele('cbc:CityName').txt('Envigado').up()
            .ele('cbc:PostalZone').txt('055422').up()
            .ele('cbc:CountrySubentity').txt('Antioquia').up()
            .ele('cbc:CountrySubentityCode').txt('05').up()
            .ele('cac:AddressLine')
              .ele('cbc:Line').txt('CL 36 D SUR 27 D 39 AP 1001').up()
            .up()
            .ele('cac:Country')
              .ele('cbc:IdentificationCode').txt('CO').up()
              .ele('cbc:Name', { languageID: 'es' }).txt('Colombia').up()
            .up()
          .up()
        .up()
        .ele('cac:PartyTaxScheme')
          .ele('cbc:RegistrationName').txt(name).up()
          .ele('cbc:CompanyID', {
            schemeID: dv,
            schemeName: '31',
            schemeAgencyID: '195',
            schemeAgencyName: 'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
          }).txt(nit).up()
          .ele('cbc:TaxLevelCode', { listName: '48' }).txt('O-99').up()
          .ele('cac:RegistrationAddress')
            .ele('cbc:ID').txt('05266').up()
            .ele('cbc:CityName').txt('Envigado').up()
            .ele('cbc:CountrySubentity').txt('Antioquia').up()
            .ele('cbc:CountrySubentityCode').txt('05').up()
            .ele('cac:AddressLine')
              .ele('cbc:Line').txt('CL 36 D SUR 27 D 39 AP 1001').up()
            .up()
            .ele('cac:Country')
              .ele('cbc:IdentificationCode').txt('CO').up()
              .ele('cbc:Name', { languageID: 'es' }).txt('Colombia').up()
            .up()
          .up()
          .ele('cac:TaxScheme')
            .ele('cbc:ID').txt('01').up()
            .ele('cbc:Name').txt('IVA').up()
          .up()
        .up()
        .ele('cac:PartyLegalEntity')
          .ele('cbc:RegistrationName').txt(name).up()
          .ele('cbc:CompanyID', {
            schemeID: dv,
            schemeName: '31',
            schemeAgencyID: '195',
            schemeAgencyName: 'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
          }).txt(nit).up()
          .ele('cac:CorporateRegistrationScheme')
            .ele('cbc:ID').txt('SETP').up()
            .ele('cbc:Name').txt('800197268').up()
          .up()
        .up()
        .ele('cac:Contact')
          .ele('cbc:ElectronicMail').txt('twosixmarca@gmail.com').up()
        .up()
      .up()
    .up();

    // Cliente (Customer)
    doc.ele('cac:AccountingCustomerParty')
      .ele('cbc:AdditionalAccountID').txt('2').up()
      .ele('cac:Party')
        .ele('cac:PartyTaxScheme')
          .ele('cbc:RegistrationName').txt(invoiceObj.customerName).up()
          .ele('cbc:CompanyID', {
            schemeName: invoiceObj.customerDocType,
            schemeAgencyID: '195',
            schemeAgencyName: 'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
          }).txt(invoiceObj.customerDoc).up()
          .ele('cbc:TaxLevelCode', { listName: '48' }).txt('R-99-PN').up()
          .ele('cac:TaxScheme')
            .ele('cbc:ID').txt('ZZ').up()
            .ele('cbc:Name').txt('No causa').up()
          .up()
        .up()
        .ele('cac:PartyLegalEntity')
          .ele('cbc:RegistrationName').txt(invoiceObj.customerName).up()
          .ele('cbc:CompanyID', { schemeName: invoiceObj.customerDocType }).txt(invoiceObj.customerDoc).up()
        .up()
      .up()
    .up();

    // Medio de pago
    doc.ele('cac:PaymentMeans')
      .ele('cbc:ID').txt('1').up()
      .ele('cbc:PaymentMeansCode').txt(invoiceObj.paymentMeansCode || '10').up()
      .ele('cbc:PaymentDueDate').txt(invoiceObj.date).up()
      .ele('cbc:PaymentID').txt(invoiceObj.number).up()
    .up();

    // Total de impuestos
    doc.ele('cac:TaxTotal')
      .ele('cbc:TaxAmount', { currencyID: 'COP' }).txt(taxTotal.toFixed(2)).up()
      .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' }).txt(subtotal.toFixed(2)).up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' }).txt(taxTotal.toFixed(2)).up()
        .ele('cac:TaxCategory')
          .ele('cbc:Percent').txt('19.00').up()
          .ele('cac:TaxScheme')
            .ele('cbc:ID').txt('01').up()
            .ele('cbc:Name').txt('IVA').up()
          .up()
        .up()
      .up()
    .up();

    // Totales monetarios
    doc.ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: 'COP' }).txt(subtotal.toFixed(2)).up()
      .ele('cbc:TaxExclusiveAmount', { currencyID: 'COP' }).txt(subtotal.toFixed(2)).up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: 'COP' }).txt(total.toFixed(2)).up()
      .ele('cbc:PayableAmount', { currencyID: 'COP' }).txt(total.toFixed(2)).up()
    .up();

    // Líneas de la factura
    lines.forEach((line, index) => {
      const lineTotal = line.quantity * line.unitPrice;
      const lineTaxPercent = line.taxPercent ?? 19;
      const lineTax = Math.round(lineTotal * lineTaxPercent / 100);

      doc.ele('cac:InvoiceLine')
        .ele('cbc:ID').txt(String(index + 1)).up()
        .ele('cbc:InvoicedQuantity', { unitCode: 'EA' }).txt(String(line.quantity)).up()
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' }).txt(lineTotal.toFixed(2)).up()
        .ele('cac:TaxTotal')
          .ele('cbc:TaxAmount', { currencyID: 'COP' }).txt(lineTax.toFixed(2)).up()
          .ele('cac:TaxSubtotal')
            .ele('cbc:TaxableAmount', { currencyID: 'COP' }).txt(lineTotal.toFixed(2)).up()
            .ele('cbc:TaxAmount', { currencyID: 'COP' }).txt(lineTax.toFixed(2)).up()
            .ele('cac:TaxCategory')
              .ele('cbc:Percent').txt(lineTaxPercent.toFixed(2)).up()
              .ele('cac:TaxScheme')
                .ele('cbc:ID').txt('01').up()
                .ele('cbc:Name').txt('IVA').up()
              .up()
            .up()
          .up()
        .up()
        .ele('cac:Item')
          .ele('cbc:Description').txt(line.description).up()
        .up()
        .ele('cac:Price')
          .ele('cbc:PriceAmount', { currencyID: 'COP' }).txt(line.unitPrice.toFixed(2)).up()
          .ele('cbc:BaseQuantity', { unitCode: 'EA' }).txt('1').up()
        .up()
      .up();
    });

    return doc.end({ prettyPrint: true });
  }
}
