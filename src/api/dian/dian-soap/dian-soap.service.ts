import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DianService } from '../dian.service';
import { randomUUID, createHash, createSign } from 'crypto';
import { DOMParser } from '@xmldom/xmldom';
import * as archiver from 'archiver';

@Injectable()
export class DianSoapService {
  private readonly logger = new Logger(DianSoapService.name);

  constructor(
    private config: ConfigService,
    @Inject(forwardRef(() => DianService)) private dianService: DianService
  ) {}

  async sendInvoice(signedXmlBuffer: Buffer, fileName: string): Promise<any> {
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');

    const endpoint = env === 'TEST'
      ? 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc'
      : 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc';

    const action = env === 'TEST'
      ? 'http://wcf.dian.colombia/IWcfDianCustomerServices/SendTestSetAsync'
      : 'http://wcf.dian.colombia/IWcfDianCustomerServices/SendBillAsync';

    const xmlFileName = `${fileName}.xml`;
    const zipFileName = `${fileName}.zip`;

    // DIAN requiere el XML dentro de un ZIP
    const zipBuffer = await this.createZipBuffer(xmlFileName, signedXmlBuffer);
    const contentFile = zipBuffer.toString('base64');
    const testSetId = this.config.get<string>('DIAN_TEST_SET_ID');
    const certCreds = this.dianService.getCredentials();

    const uuid = randomUUID();
    const toId = `id-${uuid}-To`;
    const tokenId = `id-${uuid}-Token`;
    const sigId = `id-${uuid}-Sig`;
    const kiId = `id-${uuid}-KI`;
    const strId = `id-${uuid}-STR`;
    const tsId = `id-${uuid}-TS`;

    const publicCert = certCreds.certificate
      .replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r|\n/g, '');

    const d = new Date();
    const created = d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    d.setMinutes(d.getMinutes() + 5);
    const expires = d.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const soapBody = env === 'TEST'
      ? `<wcf:SendTestSetAsync>
      <wcf:fileName>${zipFileName}</wcf:fileName>
      <wcf:contentFile>${contentFile}</wcf:contentFile>
      <wcf:testSetId>${testSetId}</wcf:testSetId>
    </wcf:SendTestSetAsync>`
      : `<wcf:SendBillAsync>
      <wcf:fileName>${zipFileName}</wcf:fileName>
      <wcf:contentFile>${contentFile}</wcf:contentFile>
    </wcf:SendBillAsync>`;

    try {
      // 1. Construir envelope SIN firma para tener el contexto completo de namespaces
      const unsignedEnvelope =
`<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia" xmlns:wsa="http://www.w3.org/2005/08/addressing">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" soap:mustUnderstand="1">
      <wsu:Timestamp wsu:Id="${tsId}">
        <wsu:Created>${created}</wsu:Created>
        <wsu:Expires>${expires}</wsu:Expires>
      </wsu:Timestamp>
      <wsse:BinarySecurityToken EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" wsu:Id="${tokenId}">${publicCert}</wsse:BinarySecurityToken>
    </wsse:Security>
    <wsa:Action>${action}</wsa:Action>
    <wsa:To wsu:Id="${toId}" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">${endpoint}</wsa:To>
  </soap:Header>
  <soap:Body>
    ${soapBody}
  </soap:Body>
</soap:Envelope>`;

      // 2. Construir forma canónica de wsa:To manualmente
      //    Exclusive C14N + PrefixList "soap wcf" incluye soap y wcf como namespaces
      //    xml-crypto no maneja correctamente PrefixList con ancestorNamespaces, así que lo hacemos manual
      const toCanonical = `<wsa:To` +
        ` xmlns:soap="http://www.w3.org/2003/05/soap-envelope"` +
        ` xmlns:wcf="http://wcf.dian.colombia"` +
        ` xmlns:wsa="http://www.w3.org/2005/08/addressing"` +
        ` xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"` +
        ` wsu:Id="${toId}"` +
        `>${endpoint}</wsa:To>`;
      this.logger.debug('Canonical wsa:To:', toCanonical);
      const toDigest = createHash('sha256').update(toCanonical).digest('base64');

      // 4. Construir SignedInfo
      const signedInfoXml =
        `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia" xmlns:wsa="http://www.w3.org/2005/08/addressing">` +
        `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">` +
        `<ec:InclusiveNamespaces xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#" PrefixList="wsa soap wcf"/>` +
        `</ds:CanonicalizationMethod>` +
        `<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
        `<ds:Reference URI="#${toId}">` +
        `<ds:Transforms>` +
        `<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">` +
        `<ec:InclusiveNamespaces xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#" PrefixList="soap wcf"/>` +
        `</ds:Transform>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
        `<ds:DigestValue>${toDigest}</ds:DigestValue>` +
        `</ds:Reference>` +
        `</ds:SignedInfo>`;

      // 5. Canonicalizar SignedInfo y firmar con RSA-SHA256
      const signedInfoDoc = new DOMParser().parseFromString(signedInfoXml, 'text/xml');
      const signedInfoCanonical = this.exclusiveC14nElement(signedInfoDoc.documentElement, 'wsa soap wcf');
      const sign = createSign('RSA-SHA256');
      sign.update(signedInfoCanonical);
      const signatureValue = sign.sign(certCreds.privateKey, 'base64');

      // 6. Construir bloque de firma
      const signatureBlock =
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${sigId}">` +
        signedInfoXml +
        `<ds:SignatureValue>${signatureValue}</ds:SignatureValue>` +
        `<ds:KeyInfo Id="${kiId}">` +
        `<wsse:SecurityTokenReference wsu:Id="${strId}">` +
        `<wsse:Reference URI="#${tokenId}" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>` +
        `</wsse:SecurityTokenReference>` +
        `</ds:KeyInfo>` +
        `</ds:Signature>`;

      // 7. Insertar firma en el Security element (después del BinarySecurityToken)
      const finalEnvelope = unsignedEnvelope.replace(
        '</wsse:BinarySecurityToken>',
        `</wsse:BinarySecurityToken>${signatureBlock}`
      );

      this.logger.debug('== [RAW SOAP REQUEST] ==');
      this.logger.debug(finalEnvelope.substring(0, 3000));
      this.logger.log('Enviando a DIAN...');

      // 8. Enviar vía fetch (SOAP 1.2)
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/soap+xml;charset=UTF-8' },
        body: finalEnvelope,
      });

      const responseText = await response.text();
      this.logger.debug('== [RAW SOAP RESPONSE] ==');
      this.logger.debug(responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      const resultMatch = responseText.match(/<(?:\w+:)?SendTestSetAsyncResult[^>]*>([\s\S]*?)<\/(?:\w+:)?SendTestSetAsyncResult>/);
      if (!resultMatch) {
        const billMatch = responseText.match(/<(?:\w+:)?SendBillAsyncResult[^>]*>([\s\S]*?)<\/(?:\w+:)?SendBillAsyncResult>/);
        return billMatch ? billMatch[1] : responseText;
      }
      return resultMatch[1];

    } catch (error) {
      this.logger.error('== [ERROR SOAP DIAN] ==');
      this.logger.error(error.message || error);
      throw error;
    }
  }

  /**
   * Consulta el estado de un documento enviado a la DIAN por su ZipKey
   */
  async getStatusZip(trackId: string): Promise<any> {
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');

    const endpoint = env === 'TEST'
      ? 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc'
      : 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc';

    const action = 'http://wcf.dian.colombia/IWcfDianCustomerServices/GetStatusZip';

    const certCreds = this.dianService.getCredentials();
    const uuid = randomUUID();
    const toId = `id-${uuid}-To`;
    const tokenId = `id-${uuid}-Token`;
    const sigId = `id-${uuid}-Sig`;
    const kiId = `id-${uuid}-KI`;
    const strId = `id-${uuid}-STR`;
    const tsId = `id-${uuid}-TS`;

    const publicCert = certCreds.certificate
      .replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r|\n/g, '');

    const d = new Date();
    const created = d.toISOString().replace(/\.\d{3}Z$/, 'Z');
    d.setMinutes(d.getMinutes() + 5);
    const expires = d.toISOString().replace(/\.\d{3}Z$/, 'Z');

    const soapBody = `<wcf:GetStatusZip>
      <wcf:trackId>${trackId}</wcf:trackId>
    </wcf:GetStatusZip>`;

    const unsignedEnvelope =
`<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia" xmlns:wsa="http://www.w3.org/2005/08/addressing">
  <soap:Header>
    <wsse:Security xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" soap:mustUnderstand="1">
      <wsu:Timestamp wsu:Id="${tsId}">
        <wsu:Created>${created}</wsu:Created>
        <wsu:Expires>${expires}</wsu:Expires>
      </wsu:Timestamp>
      <wsse:BinarySecurityToken EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" wsu:Id="${tokenId}">${publicCert}</wsse:BinarySecurityToken>
    </wsse:Security>
    <wsa:Action>${action}</wsa:Action>
    <wsa:To wsu:Id="${toId}" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">${endpoint}</wsa:To>
  </soap:Header>
  <soap:Body>
    ${soapBody}
  </soap:Body>
</soap:Envelope>`;

    try {
      // Firma (misma lógica que sendInvoice)
      const toCanonical = `<wsa:To` +
        ` xmlns:soap="http://www.w3.org/2003/05/soap-envelope"` +
        ` xmlns:wcf="http://wcf.dian.colombia"` +
        ` xmlns:wsa="http://www.w3.org/2005/08/addressing"` +
        ` xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"` +
        ` wsu:Id="${toId}"` +
        `>${endpoint}</wsa:To>`;
      const toDigest = createHash('sha256').update(toCanonical).digest('base64');

      const signedInfoXml =
        `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#" xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wcf="http://wcf.dian.colombia" xmlns:wsa="http://www.w3.org/2005/08/addressing">` +
        `<ds:CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">` +
        `<ec:InclusiveNamespaces xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#" PrefixList="wsa soap wcf"/>` +
        `</ds:CanonicalizationMethod>` +
        `<ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>` +
        `<ds:Reference URI="#${toId}">` +
        `<ds:Transforms>` +
        `<ds:Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#">` +
        `<ec:InclusiveNamespaces xmlns:ec="http://www.w3.org/2001/10/xml-exc-c14n#" PrefixList="soap wcf"/>` +
        `</ds:Transform>` +
        `</ds:Transforms>` +
        `<ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>` +
        `<ds:DigestValue>${toDigest}</ds:DigestValue>` +
        `</ds:Reference>` +
        `</ds:SignedInfo>`;

      const signedInfoDoc = new DOMParser().parseFromString(signedInfoXml, 'text/xml');
      const signedInfoCanonical = this.exclusiveC14nElement(signedInfoDoc.documentElement, 'wsa soap wcf');
      const sign = createSign('RSA-SHA256');
      sign.update(signedInfoCanonical);
      const signatureValue = sign.sign(certCreds.privateKey, 'base64');

      const signatureBlock =
        `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${sigId}">` +
        signedInfoXml +
        `<ds:SignatureValue>${signatureValue}</ds:SignatureValue>` +
        `<ds:KeyInfo Id="${kiId}">` +
        `<wsse:SecurityTokenReference wsu:Id="${strId}">` +
        `<wsse:Reference URI="#${tokenId}" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/>` +
        `</wsse:SecurityTokenReference>` +
        `</ds:KeyInfo>` +
        `</ds:Signature>`;

      const finalEnvelope = unsignedEnvelope.replace(
        '</wsse:BinarySecurityToken>',
        `</wsse:BinarySecurityToken>${signatureBlock}`
      );

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/soap+xml;charset=UTF-8' },
        body: finalEnvelope,
      });

      const responseText = await response.text();
      this.logger.debug('GetStatusZip Response:', responseText);

      return responseText;
    } catch (error) {
      this.logger.error('Error GetStatusZip:', error.message);
      throw error;
    }
  }

  /**
   * Busca un elemento por su atributo wsu:Id en el documento
   */
  private findElementByWsuId(doc: Document, id: string): Element | null {
    const wsuNs = 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd';
    const allElements = doc.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (el.getAttributeNS(wsuNs, 'Id') === id || el.getAttribute('wsu:Id') === id) {
        return el;
      }
    }
    return null;
  }

  /**
   * Exclusive C14N de un elemento DOM (mantiene contexto de namespaces ancestrales)
   */
  private exclusiveC14nElement(element: Element, inclusiveNamespacesPrefixList: string, ancestorNamespaces?: Array<{prefix: string, namespaceURI: string}>): string {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ExclusiveCanonicalization } = require('xml-crypto');
    const canon = new ExclusiveCanonicalization();
    const opts: any = {
      inclusiveNamespacesPrefixList,
      defaultNsForPrefix: {},
    };
    if (ancestorNamespaces) {
      opts.ancestorNamespaces = ancestorNamespaces;
    }
    return canon.process(element, opts).toString();
  }

  /**
   * Crea un buffer ZIP conteniendo el XML de la factura
   */
  private createZipBuffer(xmlFileName: string, xmlBuffer: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const archive = archiver('zip', { zlib: { level: 9 } });

      archive.on('data', (chunk: Buffer) => chunks.push(chunk));
      archive.on('end', () => resolve(Buffer.concat(chunks)));
      archive.on('error', reject);

      archive.append(xmlBuffer, { name: xmlFileName });
      archive.finalize();
    });
  }
}
