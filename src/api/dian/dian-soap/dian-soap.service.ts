import { Injectable, Logger, forwardRef, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as soap from 'soap';
import { DianService } from '../dian.service';
import { randomUUID } from 'crypto';
import { SignedXml } from 'xml-crypto';

@Injectable()
export class DianSoapService {
  private readonly logger = new Logger(DianSoapService.name);

  constructor(
    private config: ConfigService,
    @Inject(forwardRef(() => DianService)) private dianService: DianService
  ) {}

  async sendInvoice(signedXmlBuffer: Buffer, fileName: string): Promise<any> {
    const env = this.config.get<string>('DIAN_ENVIRONMENT', 'TEST');
    
    // Configuración estricta de Endpoint y Action
    const endpoint = env === 'TEST' 
      ? 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc'
      : 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc';

    const action = env === 'TEST'
      ? 'http://wcf.dian.colombia/IWcfDianCustomerServices/SendTestSetAsync'
      : 'http://wcf.dian.colombia/IWcfDianCustomerServices/SendBillAsync';

    const messageId = `urn:uuid:${randomUUID()}`;
    const contentFile = signedXmlBuffer.toString('base64');
    const xmlFileName = `${fileName}.xml`;
    const testSetId = this.config.get<string>('DIAN_TEST_SET_ID');

    // Body WCF con Namespace estricto para hijos
    const soapBody = env === 'TEST' 
      ? `    <SendTestSetAsync xmlns="http://wcf.dian.colombia">
      <fileName>${xmlFileName}</fileName>
      <contentFile>${contentFile}</contentFile>
      <testSetId>${testSetId}</testSetId>
    </SendTestSetAsync>`
      : `    <SendBillAsync xmlns="http://wcf.dian.colombia">
      <fileName>${xmlFileName}</fileName>
      <contentFile>${contentFile}</contentFile>
    </SendBillAsync>`;

    // Fechas WSU
    const d = new Date();
    const created = d.toISOString();
    d.setMinutes(d.getMinutes() + 10);
    const expires = d.toISOString();
    
    // Credenciales y certificado
    const certCreds = this.dianService.getCredentials();
    const publicCert = certCreds.certificate.replace(/-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|\r|\n/g, '');

    // Plantilla SOAP canónica WCF
    const unsignedXml = 
`<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:wsa="http://www.w3.org/2005/08/addressing" xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <soap:Header>
    <wsa:Action wsu:Id="ID-Action">${action}</wsa:Action>
    <wsa:To wsu:Id="ID-To">${endpoint}</wsa:To>
    <wsa:MessageID wsu:Id="ID-MessageID">${messageId}</wsa:MessageID>
    <wsa:ReplyTo wsu:Id="ID-ReplyTo">
      <wsa:Address>http://www.w3.org/2005/08/addressing/anonymous</wsa:Address>
    </wsa:ReplyTo>
    <wsse:Security soap:mustUnderstand="1" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <wsu:Timestamp wsu:Id="ID-Timestamp">
        <wsu:Created>${created}</wsu:Created>
        <wsu:Expires>${expires}</wsu:Expires>
      </wsu:Timestamp>
      <wsse:BinarySecurityToken wsu:Id="ID-Token" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3">${publicCert}</wsse:BinarySecurityToken>
      <!-- SIGNATURE_PLACEHOLDER -->
    </wsse:Security>
  </soap:Header>
  <soap:Body wsu:Id="ID-Body">
${soapBody}
  </soap:Body>
</soap:Envelope>`;

    try {
      // 1. Instanciar framework de firma nativo
      const sig = new SignedXml({
        idMode: 'wssecurity' // Importante para detectar wsu:Id
      });
      
      sig.signatureAlgorithm = 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256';
      sig.canonicalizationAlgorithm = 'http://www.w3.org/2001/10/xml-exc-c14n#';
      
      // 2. Hash exacto de los 6 elementos obligatorios para WCF
      ['ID-Action', 'ID-To', 'ID-MessageID', 'ID-ReplyTo', 'ID-Timestamp', 'ID-Body'].forEach(id => {
        (sig as any).addReference({
          xpath: `//*[@*[local-name(.)='Id' and .='${id}']]`,
          transforms: ['http://www.w3.org/2001/10/xml-exc-c14n#'],
          digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256'
        });
      });

      // 3. Proveer Referencia del Certificado (x509v3)
      (sig as any).keyInfoProvider = {
        getKeyInfo: () => `<wsse:SecurityTokenReference><wsse:Reference URI="#ID-Token" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3"/></wsse:SecurityTokenReference>`
      };

      (sig as any).signingKey = certCreds.privateKey;
      
      // 4. Firmar con prefijo ds nativo de Microsoft WCF XMLDSIG
      sig.computeSignature(unsignedXml, { prefix: 'ds' });
      const signatureXml = sig.getSignatureXml();
      
      // 5. Ensamblar Payload Final
      const signedSoapEnvelope = unsignedXml.replace('<!-- SIGNATURE_PLACEHOLDER -->', signatureXml);

      this.logger.debug('== [RAW SOAP REQUEST GENERATED] ==');
      this.logger.debug(signedSoapEnvelope);
      
      this.logger.debug('Enviando Request a DIAN HTTP...');
      
      // 6. Enviar vía Fetch Nativo
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/soap+xml; charset=utf-8',
          'SOAPAction': action
        },
        body: signedSoapEnvelope
      });

      const responseText = await response.text();
      this.logger.debug('== [RAW SOAP RESPONSE] ==');
      this.logger.debug(responseText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      // 7. Regex sencillo para extraer el resultado (evitar pesadas dependencias XML -> JSON)
      const xmlMatch = responseText.match(/<b:SendTestSetAsyncResult[^>]*>(.*?)<\/b:SendTestSetAsyncResult>/s);
      const outputStr = xmlMatch ? xmlMatch[1] : responseText;
      
      return outputStr;

    } catch (error) {
      this.logger.error('== [ERROR HTTP NATIVO WCF] ==', error);
      throw error;
    }
  }
}
