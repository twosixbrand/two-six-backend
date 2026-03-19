import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as forge from 'node-forge';

@Injectable()
export class DianService implements OnModuleInit {
  private readonly logger = new Logger(DianService.name);
  private privateKeyPem: string;
  private certificatePem: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('Inicializando DianService... cargando certificado');
    this.loadCertificate();
  }

  private loadCertificate() {
    try {
      const certPath = this.configService.get<string>('DIAN_CERT_PATH');
      const certPassword = this.configService.get<string>('DIAN_CERT_PASSWORD');

      if (!certPath || !certPassword) {
        this.logger.warn('Faltan credenciales DIAN_CERT_PATH o DIAN_CERT_PASSWORD en .env');
        return;
      }

      if (!fs.existsSync(certPath)) {
        this.logger.error(`No se encontró el certificado en la ruta: ${certPath}`);
        return;
      }

      const p12Der = fs.readFileSync(certPath, 'binary');
      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certPassword);

      let privateKey: forge.pki.PrivateKey | null = null;
      let cert: forge.pki.Certificate | null = null;

      // Extraer la llave privada y el certificado
      for (const safeContents of p12.safeContents) {
        for (const safeBag of safeContents.safeBags) {
          if (safeBag.type === forge.pki.oids.keyBag || safeBag.type === forge.pki.oids.pkcs8ShroudedKeyBag) {
            privateKey = safeBag.key as forge.pki.PrivateKey;
          } else if (safeBag.type === forge.pki.oids.certBag) {
            cert = safeBag.cert as forge.pki.Certificate;
          }
        }
      }

      if (!privateKey || !cert) {
        throw new Error('El archivo p12 no contiene una llave privada y/o certificado válido.');
      }

      this.privateKeyPem = forge.pki.privateKeyToPem(privateKey);
      this.certificatePem = forge.pki.certificateToPem(cert);
      
      this.logger.log('Certificado DIAN (GSE) cargado y descifrado exitosamente.');
    } catch (error) {
      this.logger.error(`Error al cargar el certificado DIAN: ${error.message}`);
    }
  }

  getCredentials() {
    return {
      privateKey: this.privateKeyPem,
      certificate: this.certificatePem,
    };
  }
}
