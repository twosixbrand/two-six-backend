import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as forge from 'node-forge';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class DianService implements OnModuleInit {
  private readonly logger = new Logger(DianService.name);
  private privateKeyPem: string;
  private certificatePem: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Inicializando DianService... cargando certificado');
    await this.loadCertificate();
  }

  private async loadCertificate() {
    try {
      const certPassword = this.configService.get<string>('DIAN_CERT_PASSWORD');
      const certBase64 = this.configService.get<string>('DIAN_CERT_BASE64');
      const certPath = this.configService.get<string>('DIAN_CERT_PATH');

      if (!certPassword) {
        this.logger.warn('Falta la variable DIAN_CERT_PASSWORD en .env');
        return;
      }

      let p12Der: string;

      if (certBase64) {
        // PRIORIDAD 1: Certificado embebido como Base64 en variable de entorno
        this.logger.log('Cargando certificado DIAN desde variable de entorno Base64...');
        const buffer = Buffer.from(certBase64, 'base64');
        p12Der = buffer.toString('binary');
      } else if (certPath && (certPath.startsWith('http://') || certPath.startsWith('https://'))) {
        // PRIORIDAD 2: Descargar certificado desde DigitalOcean Spaces usando S3 SDK
        p12Der = await this.downloadFromSpaces(certPath);
      } else if (certPath) {
        // PRIORIDAD 3: Leer certificado desde archivo local
        if (!fs.existsSync(certPath)) {
          this.logger.error(`No se encontró el certificado en la ruta: ${certPath}`);
          return;
        }
        p12Der = fs.readFileSync(certPath, 'binary');
      } else {
        this.logger.warn('No se configuró ninguna fuente para el certificado DIAN (DIAN_CERT_BASE64 o DIAN_CERT_PATH)');
        return;
      }

      const p12Asn1 = forge.asn1.fromDer(p12Der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, certPassword);

      let privateKey: forge.pki.PrivateKey | null = null;
      let cert: forge.pki.Certificate | null = null;

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

  /**
   * Descarga el certificado desde DigitalOcean Spaces usando credenciales S3
   */
  private async downloadFromSpaces(url: string): Promise<string> {
    const bucket = this.configService.get<string>('DO_SPACES_BUCKET');
    const region = this.configService.get<string>('DO_SPACES_REGION') || 'atl1';
    const accessKey = this.configService.get<string>('DO_SPACES_KEY');
    const secretKey = this.configService.get<string>('DO_SPACES_SECRET');

    // Endpoint S3: https://{region}.digitaloceanspaces.com (sin bucket name)
    const s3Endpoint = `https://${region}.digitaloceanspaces.com`;

    // Extraer el key del archivo desde la URL
    const urlObj = new URL(url);
    const key = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname;

    this.logger.log(`Descargando certificado desde Spaces: bucket=${bucket}, key=${key}`);

    const s3 = new S3Client({
      endpoint: s3Endpoint,
      region: region,
      credentials: {
        accessKeyId: accessKey!,
        secretAccessKey: secretKey!,
      },
      forcePathStyle: false,
    } as any);

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    const response = await s3.send(command);

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    this.logger.log(`Certificado descargado: ${buffer.length} bytes`);
    return buffer.toString('binary');
  }

  getCredentials() {
    return {
      privateKey: this.privateKeyPem,
      certificate: this.certificatePem,
    };
  }
}
