import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { create } from 'xmlbuilder2';

export interface InvoiceDto {
  number: string;
  date: string;
  time: string;
  customerName: string;
  customerDoc: string;
  customerDocType: string;
}

@Injectable()
export class DianUblService {
  constructor(private config: ConfigService) {}

  generateInvoiceXml(invoiceObj: InvoiceDto): string {
    const nit = this.config.get<string>('DIAN_COMPANY_NIT') || '';
    const dv = this.config.get<string>('DIAN_COMPANY_DV') || '';
    const name = this.config.get<string>('DIAN_COMPANY_NAME') || '';
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');
    
    // Skeleton UBL 2.1 base para la DIAN
    const doc = create({ version: '1.0', encoding: 'UTF-8', standalone: false })
      .ele('Invoice', {
        'xmlns': 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        'xmlns:cac': 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
        'xmlns:cbc': 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        'xmlns:ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2',
        'xmlns:sts': 'dian:gov:co:facturaelectronica:Structures-2-1',
        'xmlns:ds': 'http://www.w3.org/2000/09/xmldsig#',
      })
      .ele('ext:UBLExtensions')
        .ele('ext:UBLExtension')
          .ele('ext:ExtensionContent').up() // Espacio destinado para la firma
        .up()
      .up()
      .ele('cbc:UBLVersionID').txt('UBL 2.1').up()
      .ele('cbc:CustomizationID').txt('Documentos electrónicos').up()
      .ele('cbc:ProfileExecutionID').txt(env === 'TEST' ? '2' : '1').up()
      .ele('cbc:ID').txt(invoiceObj.number).up()
      .ele('cbc:IssueDate').txt(invoiceObj.date).up()
      .ele('cbc:IssueTime').txt(invoiceObj.time).up()
      .ele('cbc:InvoiceTypeCode').txt('01').up()
      .ele('cbc:DocumentCurrencyCode').txt('COP').up()
      
      .ele('cac:AccountingSupplierParty')
        .ele('cac:Party')
          .ele('cac:PartyTaxScheme')
            .ele('cbc:RegistrationName').txt(name).up()
            .ele('cbc:CompanyID', { schemeID: dv, schemeName: '31' }).txt(nit).up()
            .ele('cac:TaxScheme')
              .ele('cbc:ID').txt('01').up()
              .ele('cbc:Name').txt('IVA').up()
            .up()
          .up()
        .up()
      .up()

      .ele('cac:AccountingCustomerParty')
        .ele('cac:Party')
          .ele('cac:PartyTaxScheme')
            .ele('cbc:RegistrationName').txt(invoiceObj.customerName).up()
            .ele('cbc:CompanyID', { schemeName: invoiceObj.customerDocType }).txt(invoiceObj.customerDoc).up()
          .up()
        .up()
      .up();

      return doc.end({ prettyPrint: true });
  }
}

