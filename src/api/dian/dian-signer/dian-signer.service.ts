import { Injectable, Logger } from '@nestjs/common';
import { DianService } from '../dian.service';
import { SignedXml } from 'xml-crypto';

@Injectable()
export class DianSignerService {
  private readonly logger = new Logger(DianSignerService.name);

  constructor(private dianService: DianService) {}

  signXml(xml: string): string {
    try {
      this.logger.log('Iniciando proceso de firma XAdES-BES');
      const creds = this.dianService.getCredentials();
      if (!creds || !creds.privateKey || !creds.certificate) {
        throw new Error('Certificad o Llave Privada no cargada correctamente. Verifica la inicialización de DianService.');
      }

      // La DIAN exige Envelope signature y debe ubicarse en el primer UBLExtension vacío
      const sig: any = new SignedXml({
        privateKey: creds.privateKey,
        signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
        canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315"
      });
      
      // En versiones recientes de xml-crypto (v4+), addReference recibe un objeto de configuración
      sig.addReference({
        xpath: "//*[local-name(.)='Invoice']",
        transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256"
      });

      
      const cleanCert = creds.certificate
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n/g, '')
        .replace(/\r/g, '');

      sig.keyInfoProvider = {
        getKeyInfo: (key: string, prefix: string) => {
          return `<${prefix ? prefix + ':' : ''}X509Data><${prefix ? prefix + ':' : ''}X509Certificate>${cleanCert}</${prefix ? prefix + ':' : ''}X509Certificate></${prefix ? prefix + ':' : ''}X509Data>`;
        },
        getKey: () => Buffer.from('')
      } as any;

      sig.computeSignature(xml, {
        location: { reference: "//*[local-name(.)='ExtensionContent']", action: "append" }
      });

      return sig.getSignedXml();
    } catch (error) {
      this.logger.error(`Error firmando XML: ${error.message}`);
      throw error;
    }
  }
}

