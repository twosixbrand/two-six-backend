import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { create } from 'xmlbuilder2';

export interface InvoiceLineDto {
  description: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number; // default 19%
  discountPercentage?: number; // Descuento comercial (ej: 10 = 10%)
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

  // Nuevos campos para sts:DianExtensions
  resolutionPrefix?: string | null;
  resolutionNumber?: string | null;
  resolutionDate?: string | null;
  resolutionStartDate?: string | null;
  resolutionEndDate?: string | null;
  resolutionStartNumber?: number | null;
  resolutionEndNumber?: number | null;
}

export interface NoteDto extends InvoiceDto {
  originalInvoiceNumber: string;
  originalInvoiceDate: string;
  originalInvoiceCufe: string;
  reasonCode: string; // Catálogo de Conceptos DIAN
  reasonDesc: string; // Descripción texto libre
}

@Injectable()
export class DianUblService {
  constructor(private config: ConfigService) {}

  private getDianExtensionsObj(
    docObj: any,
    invoiceObj: InvoiceDto,
    softwareSecurityCode: string,
    isNote: boolean = false,
  ) {
    const nit = this.config.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.config.get<string>('DIAN_COMPANY_DV') || '';
    const name = (this.config.get<string>('DIAN_COMPANY_NAME') || '').replace(
      /"/g,
      '',
    );
    const softwareId = this.config.get<string>('DIAN_SOFTWARE_ID') || '';

    // UBLExtensions
    const extensions = docObj.ele('ext:UBLExtensions');

    // 1. Extension de la DIAN (sts:DianExtensions) - OBLIGATORIA
    const dianExt = extensions
      .ele('ext:UBLExtension')
      .ele('ext:ExtensionContent')
      .ele('sts:DianExtensions');

    // Notas Crédito y Débito no informan InvoiceControl en la extensión
    if (!isNote) {
      dianExt
        .ele('sts:InvoiceControl')
        .ele('sts:InvoiceAuthorization')
        .txt(invoiceObj.resolutionNumber || '18760000001')
        .up()
        .ele('sts:AuthorizationPeriod')
        .ele('cbc:StartDate')
        .txt(invoiceObj.resolutionStartDate || '2023-01-01')
        .up()
        .ele('cbc:EndDate')
        .txt(invoiceObj.resolutionEndDate || '2030-12-31')
        .up()
        .up()
        .ele('sts:AuthorizedInvoices')
        .ele('sts:Prefix')
        .txt(invoiceObj.resolutionPrefix || 'SETP')
        .up()
        .ele('sts:From')
        .txt(String(invoiceObj.resolutionStartNumber || 1))
        .up()
        .ele('sts:To')
        .txt(String(invoiceObj.resolutionEndNumber || 999999))
        .up()
        .up()
        .up();
    }

    dianExt
      .ele('sts:InvoiceSource')
      .ele('cbc:IdentificationCode', {
        listAgencyID: '6',
        listAgencyName: 'United Nations Economic Commission for Europe',
        listSchemeURI:
          'urn:oasis:names:specification:ubl:codelist:gc:CountryIdentificationCode-2.1',
      })
      .txt('CO')
      .up()
      .up();

    dianExt
      .ele('sts:SoftwareProvider')
      .ele('sts:ProviderID', {
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
        schemeID: dv,
        schemeName: '31',
      })
      .txt(nit)
      .up()
      .ele('sts:SoftwareID', {
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
      })
      .txt(softwareId)
      .up()
      .up();

    dianExt
      .ele('sts:SoftwareSecurityCode', {
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
      })
      .txt(softwareSecurityCode)
      .up();

    dianExt
      .ele('sts:AuthorizationProvider')
      .ele('sts:AuthorizationProviderID', {
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
        schemeID: '4',
        schemeName: '31',
      })
      .txt('800197268')
      .up()
      .up();

    dianExt
      .ele('sts:QRCode')
      .txt(
        `https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=CUFE_PLACEHOLDER`,
      )
      .up();

    dianExt.up().up().up();

    // 2. Extension para la firma digital (vacía para ser llenada por el SignerService)
    extensions.ele('ext:UBLExtension').ele('ext:ExtensionContent').up().up();

    extensions.up();
  }

  private buildSupplierAndCustomer(doc: any, invoiceObj: InvoiceDto) {
    const nit = this.config.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.config.get<string>('DIAN_COMPANY_DV') || '';
    const name = (this.config.get<string>('DIAN_COMPANY_NAME') || '').replace(
      /"/g,
      '',
    );

    // Emisor (Supplier)
    doc
      .ele('cac:AccountingSupplierParty')
      .ele('cbc:AdditionalAccountID')
      .txt('1')
      .up()
      .ele('cac:Party')
      .ele('cac:PartyName')
      .ele('cbc:Name')
      .txt(name)
      .up()
      .up()
      .ele('cac:PhysicalLocation')
      .ele('cac:Address')
      .ele('cbc:ID')
      .txt('05266')
      .up()
      .ele('cbc:CityName')
      .txt('Envigado')
      .up()
      .ele('cbc:PostalZone')
      .txt('055422')
      .up()
      .ele('cbc:CountrySubentity')
      .txt('Antioquia')
      .up()
      .ele('cbc:CountrySubentityCode')
      .txt('05')
      .up()
      .ele('cac:AddressLine')
      .ele('cbc:Line')
      .txt('CL 36 D SUR 27 D 39 AP 1001')
      .up()
      .up()
      .ele('cac:Country')
      .ele('cbc:IdentificationCode')
      .txt('CO')
      .up()
      .ele('cbc:Name', { languageID: 'es' })
      .txt('Colombia')
      .up()
      .up()
      .up()
      .up()
      .ele('cac:PartyTaxScheme')
      .ele('cbc:RegistrationName')
      .txt(name)
      .up()
      .ele('cbc:CompanyID', {
        schemeID: dv,
        schemeName: '31',
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
      })
      .txt(nit)
      .up()
      .ele('cbc:TaxLevelCode', { listName: '48' })
      .txt('O-47')
      .up()
      .ele('cac:RegistrationAddress')
      .ele('cbc:ID')
      .txt('05266')
      .up()
      .ele('cbc:CityName')
      .txt('Envigado')
      .up()
      .ele('cbc:CountrySubentity')
      .txt('Antioquia')
      .up()
      .ele('cbc:CountrySubentityCode')
      .txt('05')
      .up()
      .ele('cac:AddressLine')
      .ele('cbc:Line')
      .txt('CL 36 D SUR 27 D 39 AP 1001')
      .up()
      .up()
      .ele('cac:Country')
      .ele('cbc:IdentificationCode')
      .txt('CO')
      .up()
      .ele('cbc:Name', { languageID: 'es' })
      .txt('Colombia')
      .up()
      .up()
      .up()
      .ele('cac:TaxScheme')
      .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
      .txt('01')
      .up()
      .ele('cbc:Name')
      .txt('IVA')
      .up()
      .up()
      .up()
      .ele('cac:PartyLegalEntity')
      .ele('cbc:RegistrationName')
      .txt(name)
      .up()
      .ele('cbc:CompanyID', {
        schemeID: dv,
        schemeName: '31',
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
      })
      .txt(nit)
      .up()
      .ele('cac:CorporateRegistrationScheme')
      .ele('cbc:ID')
      .txt(invoiceObj.resolutionPrefix || 'SETP')
      .up()
      .ele('cbc:Name')
      .txt('800197268')
      .up()
      .up()
      .up()
      .ele('cac:Contact')
      .ele('cbc:ElectronicMail')
      .txt('twosixmarca@gmail.com')
      .up()
      .up()
      .up()
      .up();

    // Cliente (Customer)
    const customerAccountType = invoiceObj.customerDocType === '31' ? '2' : '1'; // '31' is NIT

    const customerParty = doc
      .ele('cac:AccountingCustomerParty')
      .ele('cbc:AdditionalAccountID')
      .txt(customerAccountType)
      .up()
      .ele('cac:Party')
      .ele('cac:PartyTaxScheme')
      .ele('cbc:RegistrationName')
      .txt(invoiceObj.customerName)
      .up()
      .ele('cbc:CompanyID', {
        schemeID: invoiceObj.customerDocType,
        schemeName: invoiceObj.customerDocType,
        schemeAgencyID: '195',
        schemeAgencyName:
          'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
      })
      .txt(invoiceObj.customerDoc)
      .up()
      .ele('cbc:TaxLevelCode', { listName: '48' })
      .txt(customerAccountType === '2' ? 'O-47' : 'R-99-PN')
      .up()
      .ele('cac:TaxScheme')
      .ele('cbc:ID')
      .txt('ZZ')
      .up()
      .ele('cbc:Name')
      .txt('No aplica')
      .up()
      .up()
      .up();

    customerParty
      .ele('cac:Contact')
      .ele('cbc:ElectronicMail')
      .txt(invoiceObj.customerDoc + '@receptordian.com')
      .up()
      .up();

    if (customerAccountType === '2') {
      // Legal entity
      customerParty
        .ele('cac:PartyLegalEntity')
        .ele('cbc:RegistrationName')
        .txt(invoiceObj.customerName)
        .up()
        .ele('cbc:CompanyID', {
          schemeID: invoiceObj.customerDocType,
          schemeName: invoiceObj.customerDocType,
          schemeAgencyID: '195',
          schemeAgencyName:
            'CO, DIAN (Dirección de Impuestos y Aduanas Nacionales)',
        })
        .txt(invoiceObj.customerDoc)
        .up()
        .up();
    } else {
      // Natural person
      customerParty
        .ele('cac:Person')
        .ele('cbc:FirstName')
        .txt(invoiceObj.customerName)
        .up()
        .up();
    }

    customerParty.up().up();
  }

  generateInvoiceXml(invoiceObj: InvoiceDto): string {
    const nit = this.config.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.config.get<string>('DIAN_COMPANY_DV') || '';
    const name = (this.config.get<string>('DIAN_COMPANY_NAME') || '').replace(
      /"/g,
      '',
    );
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');
    const softwareId = this.config.get<string>('DIAN_SOFTWARE_ID') || '';
    const softwarePin = this.config.get<string>('DIAN_SOFTWARE_PIN') || '';

    // SoftwareSecurityCode = SHA384(SoftwareId + SoftwarePin + InvoiceNumber)
    const crypto = require('crypto');
    const softwareSecurityCode = crypto
      .createHash('sha384')
      .update(softwareId + softwarePin + invoiceObj.number)
      .digest('hex');

    const lines =
      invoiceObj.lines && invoiceObj.lines.length > 0
        ? invoiceObj.lines
        : [
            {
              description: 'Producto',
              quantity: 1,
              unitPrice: 100000,
              taxPercent: 19,
            },
          ];

    let subtotal = 0;
    let taxTotal = 0;
    let totalAllowance = 0;
    const taxSubtotals: Record<
      string,
      { taxableAmount: number; taxAmount: number }
    > = {};

    const processedLines = lines.map((l) => {
      const originalUnitPrice = Number(l.unitPrice.toFixed(2));
      const discountRate = l.discountPercentage || 0;
      const unitDiscountAmount = Number(
        (originalUnitPrice * (discountRate / 100)).toFixed(2),
      );
      const discountedUnitPrice = Number(
        (originalUnitPrice - unitDiscountAmount).toFixed(2),
      );

      const lineGrossTotal = Number(
        (l.quantity * originalUnitPrice).toFixed(2),
      );
      const lineTotal = Number((l.quantity * discountedUnitPrice).toFixed(2));
      const lineAllowanceTotal = Number(
        (lineGrossTotal - lineTotal).toFixed(2),
      );

      const lineTaxPercent = l.taxPercent ?? 19;
      const unitTax = Number(
        (discountedUnitPrice * (lineTaxPercent / 100)).toFixed(2),
      );
      const lineTax = Number((unitTax * l.quantity).toFixed(2));

      subtotal += lineTotal;
      taxTotal += lineTax;
      totalAllowance += lineAllowanceTotal;

      const percentStr = Number(lineTaxPercent).toFixed(2);
      if (!taxSubtotals[percentStr])
        taxSubtotals[percentStr] = { taxableAmount: 0, taxAmount: 0 };
      taxSubtotals[percentStr].taxableAmount += lineTotal;
      taxSubtotals[percentStr].taxAmount += lineTax;

      return {
        ...l,
        unitPrice: originalUnitPrice,
        discountedUnitPrice,
        lineGrossTotal,
        lineTotal,
        lineAllowanceTotal,
        discountRate,
        lineTaxPercent,
        lineTax,
      };
    });

    subtotal = invoiceObj.subtotal ?? Number(subtotal.toFixed(2));
    taxTotal = invoiceObj.taxTotal ?? Number(taxTotal.toFixed(2));
    const total = invoiceObj.total ?? Number((subtotal + taxTotal).toFixed(2));

    const doc = create({
      version: '1.0',
      encoding: 'UTF-8',
      standalone: false,
    }).ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
      'xmlns:xades141': 'http://uri.etsi.org/01903/v1.4.1#',
      Id: '_0',
    });

    this.getDianExtensionsObj(doc, invoiceObj, softwareSecurityCode, false);

    doc.ele('cbc:UBLVersionID').txt('UBL 2.1').up();
    doc.ele('cbc:CustomizationID').txt('10').up();
    doc.ele('cbc:ProfileID').txt('DIAN 2.1: Factura Electrónica de Venta').up();
    doc
      .ele('cbc:ProfileExecutionID')
      .txt(env === 'TEST' ? '2' : '1')
      .up();
    doc.ele('cbc:ID').txt(invoiceObj.number).up();
    doc
      .ele('cbc:UUID', {
        schemeID: env === 'TEST' ? '2' : '1',
        schemeName: 'CUFE-SHA384',
      })
      .txt('CUFE_PLACEHOLDER')
      .up();
    doc.ele('cbc:IssueDate').txt(invoiceObj.date).up();
    doc.ele('cbc:IssueTime').txt(invoiceObj.time).up();
    doc.ele('cbc:InvoiceTypeCode').txt('01').up();
    doc.ele('cbc:Note').txt('Factura electrónica de venta').up();
    doc.ele('cbc:DocumentCurrencyCode').txt('COP').up();
    doc.ele('cbc:LineCountNumeric').txt(String(lines.length)).up();

    // Periodo de facturación
    doc
      .ele('cac:InvoicePeriod')
      .ele('cbc:StartDate')
      .txt(invoiceObj.date)
      .up()
      .ele('cbc:EndDate')
      .txt(invoiceObj.date)
      .up()
      .ele('cbc:DescriptionCode')
      .txt('1')
      .up()
      .up();

    this.buildSupplierAndCustomer(doc, invoiceObj);

    // Medio de pago
    doc
      .ele('cac:PaymentMeans')
      .ele('cbc:ID')
      .txt('1')
      .up()
      .ele('cbc:PaymentMeansCode')
      .txt(invoiceObj.paymentMeansCode || '10')
      .up()
      .ele('cbc:PaymentDueDate')
      .txt(invoiceObj.date)
      .up()
      .ele('cbc:PaymentID')
      .txt(invoiceObj.number)
      .up()
      .up();

    // Total de impuestos
    const taxTotalNode = doc
      .ele('cac:TaxTotal')
      .ele('cbc:TaxAmount', { currencyID: 'COP' })
      .txt(taxTotal.toFixed(2))
      .up();

    for (const [percent, amounts] of Object.entries(taxSubtotals)) {
      taxTotalNode
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' })
        .txt(amounts.taxableAmount.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(amounts.taxAmount.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cbc:Percent')
        .txt(percent)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up();
    }
    taxTotalNode.up();

    // Totales monetarios
    const legalMonetary = doc
      .ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxExclusiveAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up();
    if (totalAllowance > 0) {
      legalMonetary
        .ele('cbc:AllowanceTotalAmount', { currencyID: 'COP' })
        .txt(totalAllowance.toFixed(2))
        .up();
    }
    legalMonetary
      .ele('cbc:PayableAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up()
      .up();

    // Líneas de la factura
    processedLines.forEach((line, index) => {
      const {
        unitPrice,
        discountedUnitPrice,
        lineTotal,
        lineAllowanceTotal,
        lineGrossTotal,
        discountRate,
        lineTaxPercent,
        lineTax,
      } = line;
      const taxPercentStr = Number(lineTaxPercent).toFixed(2); // '19.00'

      const invLine = doc
        .ele('cac:InvoiceLine')
        .ele('cbc:ID')
        .txt(String(index + 1))
        .up()
        .ele('cbc:InvoicedQuantity', { unitCode: '94' })
        .txt(String(line.quantity))
        .up()
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
        .txt(lineTotal.toFixed(2))
        .up();

      // Descuento comercial por línea (AllowanceCharge)
      if (lineAllowanceTotal > 0) {
        invLine
          .ele('cac:AllowanceCharge')
          .ele('cbc:ID')
          .txt('1')
          .up()
          .ele('cbc:ChargeIndicator')
          .txt('false')
          .up()
          .ele('cbc:AllowanceChargeReasonCode')
          .txt('00')
          .up()
          .ele('cbc:AllowanceChargeReason')
          .txt('Descuento comercial')
          .up()
          .ele('cbc:MultiplierFactorNumeric')
          .txt(discountRate.toFixed(2))
          .up()
          .ele('cbc:Amount', { currencyID: 'COP' })
          .txt(lineAllowanceTotal.toFixed(2))
          .up()
          .ele('cbc:BaseAmount', { currencyID: 'COP' })
          .txt(lineGrossTotal.toFixed(2))
          .up()
          .up();
      }

      invLine
        .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(lineTax.toFixed(2))
        .up()
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' })
        .txt(lineTotal.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(lineTax.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cbc:Percent')
        .txt(taxPercentStr)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up()
        .up()
        .ele('cac:Item')
        .ele('cbc:Description')
        .txt(line.description)
        .up()
        .ele('cac:StandardItemIdentification')
        .ele('cbc:ID', { schemeID: '999' })
        .txt('001')
        .up()
        .up()
        .ele('cac:ClassifiedTaxCategory')
        .ele('cbc:Percent')
        .txt(taxPercentStr)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up()
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: 'COP' })
        .txt(unitPrice.toFixed(2))
        .up()
        .ele('cbc:BaseQuantity', { unitCode: '94' })
        .txt('1')
        .up()
        .up()
        .up();
    });

    return doc.end({ prettyPrint: true });
  }

  generateCreditNoteXml(noteObj: NoteDto): string {
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');
    const softwareId = this.config.get<string>('DIAN_SOFTWARE_ID') || '';
    const softwarePin = this.config.get<string>('DIAN_SOFTWARE_PIN') || '';

    const crypto = require('crypto');
    const softwareSecurityCode = crypto
      .createHash('sha384')
      .update(softwareId + softwarePin + noteObj.number)
      .digest('hex');

    const lines =
      noteObj.lines && noteObj.lines.length > 0
        ? noteObj.lines
        : [
            {
              description: 'Devolución Producto',
              quantity: 1,
              unitPrice: 100000,
              taxPercent: 19,
            },
          ];

    let subtotal = 0;
    let taxTotal = 0;
    let totalAllowance = 0;
    const taxSubtotals: Record<
      string,
      { taxableAmount: number; taxAmount: number }
    > = {};

    const processedLines = lines.map((l) => {
      const originalUnitPrice = Number(l.unitPrice.toFixed(2));
      const discountRate = l.discountPercentage || 0;
      const unitDiscountAmount = Number(
        (originalUnitPrice * (discountRate / 100)).toFixed(2),
      );
      const discountedUnitPrice = Number(
        (originalUnitPrice - unitDiscountAmount).toFixed(2),
      );

      const lineGrossTotal = Number(
        (l.quantity * originalUnitPrice).toFixed(2),
      );
      const lineTotal = Number((l.quantity * discountedUnitPrice).toFixed(2));
      const lineAllowanceTotal = Number(
        (lineGrossTotal - lineTotal).toFixed(2),
      );

      const lineTaxPercent = l.taxPercent ?? 19;
      const unitTax = Number(
        (discountedUnitPrice * (lineTaxPercent / 100)).toFixed(2),
      );
      const lineTax = Number((unitTax * l.quantity).toFixed(2));

      subtotal += lineTotal;
      taxTotal += lineTax;
      totalAllowance += lineAllowanceTotal;

      const percentStr = Number(lineTaxPercent).toFixed(2);
      if (!taxSubtotals[percentStr])
        taxSubtotals[percentStr] = { taxableAmount: 0, taxAmount: 0 };
      taxSubtotals[percentStr].taxableAmount += lineTotal;
      taxSubtotals[percentStr].taxAmount += lineTax;

      return {
        ...l,
        unitPrice: originalUnitPrice,
        discountedUnitPrice,
        lineGrossTotal,
        lineTotal,
        lineAllowanceTotal,
        discountRate,
        lineTaxPercent,
        lineTax,
      };
    });

    subtotal = noteObj.subtotal ?? Number(subtotal.toFixed(2));
    taxTotal = noteObj.taxTotal ?? Number(taxTotal.toFixed(2));
    const total = noteObj.total ?? Number((subtotal + taxTotal).toFixed(2));

    const doc = create({
      version: '1.0',
      encoding: 'UTF-8',
      standalone: false,
    }).ele('CreditNote', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
      'xmlns:xades141': 'http://uri.etsi.org/01903/v1.4.1#',
      Id: '_0',
    });

    this.getDianExtensionsObj(doc, noteObj, softwareSecurityCode, true);

    doc.ele('cbc:UBLVersionID').txt('UBL 2.1').up();
    doc.ele('cbc:CustomizationID').txt('20').up();
    doc
      .ele('cbc:ProfileID')
      .txt('DIAN 2.1: Nota Crédito de Factura Electrónica de Venta')
      .up();
    doc
      .ele('cbc:ProfileExecutionID')
      .txt(env === 'TEST' ? '2' : '1')
      .up();
    doc.ele('cbc:ID').txt(noteObj.number).up();
    doc
      .ele('cbc:UUID', {
        schemeID: env === 'TEST' ? '2' : '1',
        schemeName: 'CUDE-SHA384',
      })
      .txt('CUFE_PLACEHOLDER')
      .up();
    doc.ele('cbc:IssueDate').txt(noteObj.date).up();
    doc.ele('cbc:IssueTime').txt(noteObj.time).up();
    doc.ele('cbc:CreditNoteTypeCode').txt('91').up();
    doc
      .ele('cbc:Note')
      .txt(noteObj.reasonDesc || 'Nota Crédito')
      .up();
    doc.ele('cbc:DocumentCurrencyCode').txt('COP').up();
    doc.ele('cbc:LineCountNumeric').txt(String(lines.length)).up();

    doc
      .ele('cac:DiscrepancyResponse')
      .ele('cbc:ReferenceID')
      .txt(noteObj.originalInvoiceNumber)
      .up()
      .ele('cbc:ResponseCode')
      .txt(noteObj.reasonCode)
      .up()
      .ele('cbc:Description')
      .txt(noteObj.reasonDesc || 'Devolución')
      .up()
      .up();

    doc
      .ele('cac:BillingReference')
      .ele('cac:InvoiceDocumentReference')
      .ele('cbc:ID')
      .txt(noteObj.originalInvoiceNumber)
      .up()
      .ele('cbc:UUID', { schemeName: 'CUFE-SHA384' })
      .txt(noteObj.originalInvoiceCufe)
      .up()
      .ele('cbc:IssueDate')
      .txt(noteObj.originalInvoiceDate)
      .up()
      .up()
      .up();

    this.buildSupplierAndCustomer(doc, noteObj);

    doc
      .ele('cac:PaymentMeans')
      .ele('cbc:ID')
      .txt('1')
      .up()
      .ele('cbc:PaymentMeansCode')
      .txt(noteObj.paymentMeansCode || '10')
      .up()
      .ele('cbc:PaymentDueDate')
      .txt(noteObj.date)
      .up()
      .ele('cbc:PaymentID')
      .txt(noteObj.number)
      .up()
      .up();

    // Totales y lineas (CreditNoteLine instead of InvoiceLine)
    const taxTotalNode = doc
      .ele('cac:TaxTotal')
      .ele('cbc:TaxAmount', { currencyID: 'COP' })
      .txt(taxTotal.toFixed(2))
      .up();

    for (const [percent, amounts] of Object.entries(taxSubtotals)) {
      taxTotalNode
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' })
        .txt(amounts.taxableAmount.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(amounts.taxAmount.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cbc:Percent')
        .txt(percent)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up();
    }
    taxTotalNode.up();

    const legalMonetary = doc
      .ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxExclusiveAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up();
    if (totalAllowance > 0) {
      legalMonetary
        .ele('cbc:AllowanceTotalAmount', { currencyID: 'COP' })
        .txt(totalAllowance.toFixed(2))
        .up();
    }
    legalMonetary
      .ele('cbc:PayableAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up()
      .up();

    processedLines.forEach((line, index) => {
      const {
        unitPrice,
        discountedUnitPrice,
        lineTotal,
        lineAllowanceTotal,
        lineGrossTotal,
        discountRate,
        lineTaxPercent,
        lineTax,
      } = line;
      const taxPercentStr = Number(lineTaxPercent).toFixed(2);

      const noteLine = doc
        .ele('cac:CreditNoteLine')
        .ele('cbc:ID')
        .txt(String(index + 1))
        .up()
        .ele('cbc:CreditedQuantity', { unitCode: '94' })
        .txt(String(line.quantity))
        .up()
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
        .txt(lineTotal.toFixed(2))
        .up();

      if (lineAllowanceTotal > 0) {
        noteLine
          .ele('cac:AllowanceCharge')
          .ele('cbc:ID')
          .txt('1')
          .up()
          .ele('cbc:ChargeIndicator')
          .txt('false')
          .up()
          .ele('cbc:AllowanceChargeReasonCode')
          .txt('00')
          .up()
          .ele('cbc:AllowanceChargeReason')
          .txt('Descuento comercial')
          .up()
          .ele('cbc:MultiplierFactorNumeric')
          .txt(discountRate.toFixed(2))
          .up()
          .ele('cbc:Amount', { currencyID: 'COP' })
          .txt(lineAllowanceTotal.toFixed(2))
          .up()
          .ele('cbc:BaseAmount', { currencyID: 'COP' })
          .txt(lineGrossTotal.toFixed(2))
          .up()
          .up();
      }

      noteLine
        .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(lineTax.toFixed(2))
        .up()
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' })
        .txt(lineTotal.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(lineTax.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cbc:Percent')
        .txt(taxPercentStr)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up()
        .up()
        .ele('cac:Item')
        .ele('cbc:Description')
        .txt(line.description)
        .up()
        .ele('cac:StandardItemIdentification')
        .ele('cbc:ID', { schemeID: '999' })
        .txt('001')
        .up()
        .up()
        .ele('cac:ClassifiedTaxCategory')
        .ele('cbc:Percent')
        .txt(taxPercentStr)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up()
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: 'COP' })
        .txt(unitPrice.toFixed(2))
        .up()
        .ele('cbc:BaseQuantity', { unitCode: '94' })
        .txt('1')
        .up()
        .up()
        .up();
    });

    return doc.end({ prettyPrint: true });
  }

  generateDebitNoteXml(noteObj: NoteDto): string {
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');
    const softwareId = this.config.get<string>('DIAN_SOFTWARE_ID') || '';
    const softwarePin = this.config.get<string>('DIAN_SOFTWARE_PIN') || '';

    const crypto = require('crypto');
    const softwareSecurityCode = crypto
      .createHash('sha384')
      .update(softwareId + softwarePin + noteObj.number)
      .digest('hex');

    const lines =
      noteObj.lines && noteObj.lines.length > 0
        ? noteObj.lines
        : [
            {
              description: 'Ajuste Producto',
              quantity: 1,
              unitPrice: 100000,
              taxPercent: 19,
            },
          ];

    let subtotal = 0;
    let taxTotal = 0;
    let totalAllowance = 0;
    const taxSubtotals: Record<
      string,
      { taxableAmount: number; taxAmount: number }
    > = {};

    const processedLines = lines.map((l) => {
      const originalUnitPrice = Number(l.unitPrice.toFixed(2));
      const discountRate = l.discountPercentage || 0;
      const unitDiscountAmount = Number(
        (originalUnitPrice * (discountRate / 100)).toFixed(2),
      );
      const discountedUnitPrice = Number(
        (originalUnitPrice - unitDiscountAmount).toFixed(2),
      );

      const lineGrossTotal = Number(
        (l.quantity * originalUnitPrice).toFixed(2),
      );
      const lineTotal = Number((l.quantity * discountedUnitPrice).toFixed(2));
      const lineAllowanceTotal = Number(
        (lineGrossTotal - lineTotal).toFixed(2),
      );

      const lineTaxPercent = l.taxPercent ?? 19;
      const unitTax = Number(
        (discountedUnitPrice * (lineTaxPercent / 100)).toFixed(2),
      );
      const lineTax = Number((unitTax * l.quantity).toFixed(2));

      subtotal += lineTotal;
      taxTotal += lineTax;
      totalAllowance += lineAllowanceTotal;

      const percentStr = Number(lineTaxPercent).toFixed(2);
      if (!taxSubtotals[percentStr])
        taxSubtotals[percentStr] = { taxableAmount: 0, taxAmount: 0 };
      taxSubtotals[percentStr].taxableAmount += lineTotal;
      taxSubtotals[percentStr].taxAmount += lineTax;

      return {
        ...l,
        unitPrice: originalUnitPrice,
        discountedUnitPrice,
        lineGrossTotal,
        lineTotal,
        lineAllowanceTotal,
        discountRate,
        lineTaxPercent,
        lineTax,
      };
    });

    subtotal = noteObj.subtotal ?? Number(subtotal.toFixed(2));
    taxTotal = noteObj.taxTotal ?? Number(taxTotal.toFixed(2));
    const total = noteObj.total ?? Number((subtotal + taxTotal).toFixed(2));

    const doc = create({
      version: '1.0',
      encoding: 'UTF-8',
      standalone: false,
    }).ele('DebitNote', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:DebitNote-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
      'xmlns:xades141': 'http://uri.etsi.org/01903/v1.4.1#',
      Id: '_0',
    });

    this.getDianExtensionsObj(doc, noteObj, softwareSecurityCode, true);

    doc.ele('cbc:UBLVersionID').txt('UBL 2.1').up();
    doc.ele('cbc:CustomizationID').txt('30').up();
    doc
      .ele('cbc:ProfileID')
      .txt('DIAN 2.1: Nota Débito de Factura Electrónica de Venta')
      .up();
    doc
      .ele('cbc:ProfileExecutionID')
      .txt(env === 'TEST' ? '2' : '1')
      .up();
    doc.ele('cbc:ID').txt(noteObj.number).up();
    doc
      .ele('cbc:UUID', {
        schemeID: env === 'TEST' ? '2' : '1',
        schemeName: 'CUDE-SHA384',
      })
      .txt('CUFE_PLACEHOLDER')
      .up();
    doc.ele('cbc:IssueDate').txt(noteObj.date).up();
    doc.ele('cbc:IssueTime').txt(noteObj.time).up();
    doc
      .ele('cbc:Note')
      .txt(noteObj.reasonDesc || 'Nota Débito')
      .up();
    doc.ele('cbc:DocumentCurrencyCode').txt('COP').up();
    doc.ele('cbc:LineCountNumeric').txt(String(lines.length)).up();

    doc
      .ele('cac:DiscrepancyResponse')
      .ele('cbc:ReferenceID')
      .txt(noteObj.originalInvoiceNumber)
      .up()
      .ele('cbc:ResponseCode')
      .txt(noteObj.reasonCode)
      .up()
      .ele('cbc:Description')
      .txt(noteObj.reasonDesc || 'Ajuste en precio')
      .up()
      .up();

    doc
      .ele('cac:BillingReference')
      .ele('cac:InvoiceDocumentReference')
      .ele('cbc:ID')
      .txt(noteObj.originalInvoiceNumber)
      .up()
      .ele('cbc:UUID', { schemeName: 'CUFE-SHA384' })
      .txt(noteObj.originalInvoiceCufe)
      .up()
      .ele('cbc:IssueDate')
      .txt(noteObj.originalInvoiceDate)
      .up()
      .up()
      .up();

    this.buildSupplierAndCustomer(doc, noteObj);

    doc
      .ele('cac:PaymentMeans')
      .ele('cbc:ID')
      .txt('1')
      .up()
      .ele('cbc:PaymentMeansCode')
      .txt(noteObj.paymentMeansCode || '10')
      .up()
      .ele('cbc:PaymentDueDate')
      .txt(noteObj.date)
      .up()
      .ele('cbc:PaymentID')
      .txt(noteObj.number)
      .up()
      .up();

    const taxTotalNode = doc
      .ele('cac:TaxTotal')
      .ele('cbc:TaxAmount', { currencyID: 'COP' })
      .txt(taxTotal.toFixed(2))
      .up();

    for (const [percent, amounts] of Object.entries(taxSubtotals)) {
      taxTotalNode
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' })
        .txt(amounts.taxableAmount.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(amounts.taxAmount.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cbc:Percent')
        .txt(percent)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up();
    }
    taxTotalNode.up();

    const requestedMonetary = doc
      .ele('cac:RequestedMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxExclusiveAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up();
    if (totalAllowance > 0) {
      requestedMonetary
        .ele('cbc:AllowanceTotalAmount', { currencyID: 'COP' })
        .txt(totalAllowance.toFixed(2))
        .up();
    }
    requestedMonetary
      .ele('cbc:PayableAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up()
      .up();

    processedLines.forEach((line, index) => {
      const {
        unitPrice,
        discountedUnitPrice,
        lineTotal,
        lineAllowanceTotal,
        lineGrossTotal,
        discountRate,
        lineTaxPercent,
        lineTax,
      } = line;
      const taxPercentStr = Number(lineTaxPercent).toFixed(2);

      const noteLine = doc
        .ele('cac:DebitNoteLine')
        .ele('cbc:ID')
        .txt(String(index + 1))
        .up()
        .ele('cbc:DebitedQuantity', { unitCode: '94' })
        .txt(String(line.quantity))
        .up()
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
        .txt(lineTotal.toFixed(2))
        .up();

      if (lineAllowanceTotal > 0) {
        noteLine
          .ele('cac:AllowanceCharge')
          .ele('cbc:ID')
          .txt('1')
          .up()
          .ele('cbc:ChargeIndicator')
          .txt('false')
          .up()
          .ele('cbc:AllowanceChargeReasonCode')
          .txt('00')
          .up()
          .ele('cbc:AllowanceChargeReason')
          .txt('Descuento comercial')
          .up()
          .ele('cbc:MultiplierFactorNumeric')
          .txt(discountRate.toFixed(2))
          .up()
          .ele('cbc:Amount', { currencyID: 'COP' })
          .txt(lineAllowanceTotal.toFixed(2))
          .up()
          .ele('cbc:BaseAmount', { currencyID: 'COP' })
          .txt(lineGrossTotal.toFixed(2))
          .up()
          .up();
      }

      noteLine
        .ele('cac:TaxTotal')
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(lineTax.toFixed(2))
        .up()
        .ele('cac:TaxSubtotal')
        .ele('cbc:TaxableAmount', { currencyID: 'COP' })
        .txt(lineTotal.toFixed(2))
        .up()
        .ele('cbc:TaxAmount', { currencyID: 'COP' })
        .txt(lineTax.toFixed(2))
        .up()
        .ele('cac:TaxCategory')
        .ele('cbc:Percent')
        .txt(taxPercentStr)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up()
        .up()
        .ele('cac:Item')
        .ele('cbc:Description')
        .txt(line.description)
        .up()
        .ele('cac:StandardItemIdentification')
        .ele('cbc:ID', { schemeID: '999' })
        .txt('001')
        .up()
        .up()
        .ele('cac:ClassifiedTaxCategory')
        .ele('cbc:Percent')
        .txt(taxPercentStr)
        .up()
        .ele('cac:TaxScheme')
        .ele('cbc:ID', { schemeID: '01', schemeName: 'IVA' })
        .txt('01')
        .up()
        .ele('cbc:Name')
        .txt('IVA')
        .up()
        .up()
        .up()
        .up()
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: 'COP' })
        .txt(unitPrice.toFixed(2))
        .up()
        .ele('cbc:BaseQuantity', { unitCode: '94' })
        .txt('1')
        .up()
        .up()
        .up();
    });

    return doc.end({ prettyPrint: true });
  }

  generateSupportDocumentXml(docObj: InvoiceDto): string {
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');
    const softwareId = this.config.get<string>('DIAN_SOFTWARE_ID') || '';
    const softwarePin = this.config.get<string>('DIAN_SOFTWARE_PIN') || '';

    const crypto = require('crypto');
    const softwareSecurityCode = crypto
      .createHash('sha384')
      .update(softwareId + softwarePin + docObj.number)
      .digest('hex');

    const lines = docObj.lines || [];
    const subtotal = docObj.subtotal || 0;
    const taxTotal = docObj.taxTotal || 0;
    const total = docObj.total || subtotal + taxTotal;

    const doc = create({
      version: '1.0',
      encoding: 'UTF-8',
      standalone: false,
    }).ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
      'xmlns:ext':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
      'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
      'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      'xmlns:xades': 'http://uri.etsi.org/01903/v1.3.2#',
      'xmlns:xades141': 'http://uri.etsi.org/01903/v1.4.1#',
      Id: '_0',
    });

    this.getDianExtensionsObj(doc, docObj, softwareSecurityCode, false);

    doc.ele('cbc:UBLVersionID').txt('UBL 2.1').up();
    doc.ele('cbc:CustomizationID').txt('11').up();
    doc
      .ele('cbc:ProfileID')
      .txt(
        'DIAN 2.1: Documento Soporte en adquisiciones efectuadas a sujetos no obligados a expedir factura de venta',
      )
      .up();
    doc
      .ele('cbc:ProfileExecutionID')
      .txt(env === 'TEST' ? '2' : '1')
      .up();
    doc.ele('cbc:ID').txt(docObj.number).up();
    doc
      .ele('cbc:UUID', {
        schemeID: env === 'TEST' ? '2' : '1',
        schemeName: 'CUDS-SHA384',
      })
      .txt('CUDS_PLACEHOLDER')
      .up();
    doc.ele('cbc:IssueDate').txt(docObj.date).up();
    doc.ele('cbc:IssueTime').txt(docObj.time).up();
    doc.ele('cbc:InvoiceTypeCode').txt('05').up(); // 05 = Documento Soporte
    doc
      .ele('cbc:Note')
      .txt(
        'Documento soporte en adquisiciones efectuadas a no obligados a facturar',
      )
      .up();
    doc.ele('cbc:DocumentCurrencyCode').txt('COP').up();
    doc.ele('cbc:LineCountNumeric').txt(String(lines.length)).up();

    this.buildSupplierAndCustomer(doc, docObj);

    // Medios de pago
    doc
      .ele('cac:PaymentMeans')
      .ele('cbc:ID')
      .txt('1')
      .up()
      .ele('cbc:PaymentMeansCode')
      .txt(docObj.paymentMeansCode || '10')
      .up()
      .ele('cbc:PaymentDueDate')
      .txt(docObj.date)
      .up()
      .up();

    // Totales
    doc
      .ele('cac:TaxTotal')
      .ele('cbc:TaxAmount', { currencyID: 'COP' })
      .txt(taxTotal.toFixed(2))
      .up()
      .up();

    doc
      .ele('cac:LegalMonetaryTotal')
      .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxExclusiveAmount', { currencyID: 'COP' })
      .txt(subtotal.toFixed(2))
      .up()
      .ele('cbc:TaxInclusiveAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up()
      .ele('cbc:PayableAmount', { currencyID: 'COP' })
      .txt(total.toFixed(2))
      .up()
      .up();

    // Líneas
    lines.forEach((line, index) => {
      doc
        .ele('cac:InvoiceLine')
        .ele('cbc:ID')
        .txt(String(index + 1))
        .up()
        .ele('cbc:InvoicedQuantity', { unitCode: '94' })
        .txt(String(line.quantity))
        .up()
        .ele('cbc:LineExtensionAmount', { currencyID: 'COP' })
        .txt((line.quantity * line.unitPrice).toFixed(2))
        .up()
        .ele('cac:Item')
        .ele('cbc:Description')
        .txt(line.description)
        .up()
        .up()
        .ele('cac:Price')
        .ele('cbc:PriceAmount', { currencyID: 'COP' })
        .txt(line.unitPrice.toFixed(2))
        .up()
        .up()
        .up();
    });

    return doc.end({ prettyPrint: true });
  }
}
