import { Injectable, Logger } from '@nestjs/common';
import { DianService } from '../dian.service';
import { SignedXml } from 'xml-crypto';

@Injectable()
export class DianSignerService {
  private readonly logger = new Logger(DianSignerService.name);

  constructor(private dianService: DianService) {}

  signXml(xml: string): string {
    try {
      this.logger.log('Iniciando proceso de firma XAdES-EPES');
      const creds = this.dianService.getCredentials();
      if (!creds || !creds.privateKey || !creds.certificate) {
        throw new Error('Certificad o Llave Privada no cargada correctamente.');
      }

      const crypto = require('crypto');
      const { C14nCanonicalization } = require('xml-crypto');

      const DOMParser = require('@xmldom/xmldom').DOMParser;
      const XMLSerializer = require('@xmldom/xmldom').XMLSerializer;

      const c14n = new C14nCanonicalization();

      // Limpiar certificado para KeyInfo y CertDigest
      const cleanCert = creds.certificate
        .replace('-----BEGIN CERTIFICATE-----', '')
        .replace('-----END CERTIFICATE-----', '')
        .replace(/\n/g, '')
        .replace(/\r/g, '')
        .trim();

      const certBuffer = Buffer.from(cleanCert, 'base64');
      const certDigest = crypto
        .createHash('sha256')
        .update(certBuffer)
        .digest('base64');

      // Extraer IssueDate y IssueTime del XML para alinear SignedTime (regla FAD09e)
      const issueDateMatch = xml.match(/<cbc:IssueDate>(.+?)<\/cbc:IssueDate>/);
      const issueTimeMatch = xml.match(/<cbc:IssueTime>(.+?)<\/cbc:IssueTime>/);
      const invoiceDate = issueDateMatch ? issueDateMatch[1] : '2023-01-01';
      const invoiceTime = issueTimeMatch ? issueTimeMatch[1] : '12:00:00-05:00';
      const signingTime = `${invoiceDate}T${invoiceTime}`;

      const issuerName =
        'CN=OlimpiaIT ECD Sub, O=OlimpiaIT, OU=OlimpiaIT ECD, E=servicioalcliente@olimpiait.com, C=CO, S=Bogotá D.C., L=Bogotá D.C., SERIALNUMBER=900032774-4';
      const serialNumber = '89407279672106850539243115121212403761';

      const sigId = 'xmldsig-Signature-TwoSix';
      const signedPropsId = `xades-${sigId}-signedprops`;

      const parser = new DOMParser();

      // 1. Elemento KeyInfo
      const keyInfoXml = `<ds:KeyInfo Id="${sigId}-KeyInfo" xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:X509Data><ds:X509Certificate>${cleanCert}</ds:X509Certificate></ds:X509Data></ds:KeyInfo>`;

      // 2. Elemento SignedProperties (XAdES)
      const signedPropertiesXml = `<xades:SignedProperties Id="${signedPropsId}" xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"><xades:SignedSignatureProperties><xades:SigningTime>${signingTime}</xades:SigningTime><xades:SigningCertificate><xades:Cert><xades:CertDigest><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" xmlns:ds="http://www.w3.org/2000/09/xmldsig#"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${certDigest}</ds:DigestValue></xades:CertDigest><xades:IssuerSerial><ds:X509IssuerName xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${issuerName}</ds:X509IssuerName><ds:X509SerialNumber xmlns:ds="http://www.w3.org/2000/09/xmldsig#">${serialNumber}</ds:X509SerialNumber></xades:IssuerSerial></xades:Cert></xades:SigningCertificate><xades:SignaturePolicyIdentifier><xades:SignaturePolicyId><xades:SigPolicyId><xades:Identifier>https://facturaelectronica.dian.gov.co/politicadefirma/v2/politicadefirmav2.pdf</xades:Identifier></xades:SigPolicyId><xades:SigPolicyHash><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256" xmlns:ds="http://www.w3.org/2000/09/xmldsig#"/><ds:DigestValue xmlns:ds="http://www.w3.org/2000/09/xmldsig#">dMoMvtcG5aIzgYo0tIsSQeVJBDnUnfSOfBpxXrmor0Y=</ds:DigestValue></xades:SigPolicyHash></xades:SignaturePolicyId></xades:SignaturePolicyIdentifier><xades:SignerRole><xades:ClaimedRoles><xades:ClaimedRole>supplier</xades:ClaimedRole></xades:ClaimedRoles></xades:SignerRole></xades:SignedSignatureProperties></xades:SignedProperties>`;

      const objectXml = `<ds:Object Id="XadesObjectId-${sigId}"><xades:QualifyingProperties xmlns:xades="http://uri.etsi.org/01903/v1.3.2#" Target="#${sigId}">${signedPropertiesXml}</xades:QualifyingProperties></ds:Object>`;

      // 3. Documento original (Invoice) - digest
      const invoiceToDigest = xml.replace(/ Id="_0"/g, '');
      const invoiceDoc = parser.parseFromString(invoiceToDigest, 'text/xml');
      const invoiceC14n = c14n.process(invoiceDoc.documentElement);
      const invoiceDigest = crypto
        .createHash('sha256')
        .update(invoiceC14n)
        .digest('base64');

      // 4. Armar el esqueleto de SignedInfo con placeholders
      const signedInfoXml = `<ds:SignedInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#"><ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/><ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/><ds:Reference URI=""><ds:Transforms><ds:Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/></ds:Transforms><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>${invoiceDigest}</ds:DigestValue></ds:Reference><ds:Reference URI="#${sigId}-KeyInfo"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>KEYINFO_PLACEHOLDER</ds:DigestValue></ds:Reference><ds:Reference Type="http://uri.etsi.org/01903#SignedProperties" URI="#${signedPropsId}"><ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/><ds:DigestValue>SIGNEDPROPS_PLACEHOLDER</ds:DigestValue></ds:Reference></ds:SignedInfo>`;

      const signatureBlockWrapper = `<ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#" Id="${sigId}">${signedInfoXml}<ds:SignatureValue Id="${sigId}-SignatureValue">SIG_PLACEHOLDER</ds:SignatureValue>${keyInfoXml}${objectXml}</ds:Signature>`;

      // 5. Inyectar temporalmente en el XML total
      const mockFinalXml = invoiceToDigest.replace(
        '<ext:ExtensionContent/>',
        `<ext:ExtensionContent>${signatureBlockWrapper}</ext:ExtensionContent>`,
      );
      const fullDoc = parser.parseFromString(mockFinalXml, 'text/xml');

      // Helper: recorrer ancestros y recolectar namespaces heredados
      function collectAncestorNamespaces(
        node: any,
      ): Array<{ prefix: string; namespaceURI: string }> {
        const nsArray: Array<{ prefix: string; namespaceURI: string }> = [];
        let parent = node.parentNode;
        while (parent && parent.nodeType === 1) {
          if (parent.attributes) {
            for (let i = 0; i < parent.attributes.length; i++) {
              const attr = parent.attributes[i];
              if (attr.nodeName && attr.nodeName.indexOf('xmlns') === 0) {
                const prefix =
                  attr.nodeName === 'xmlns'
                    ? ''
                    : attr.nodeName.replace('xmlns:', '');
                // Solo agregar si no existe ya
                if (!nsArray.find((n) => n.prefix === prefix)) {
                  nsArray.push({ prefix, namespaceURI: attr.nodeValue || '' });
                }
              }
            }
          }
          parent = parent.parentNode;
        }
        return nsArray;
      }

      function findNodeById(node: any, id: string): any {
        if (node.nodeType === 1 && node.getAttribute('Id') === id) return node;
        if (node.childNodes) {
          for (let i = 0; i < node.childNodes.length; i++) {
            const found = findNodeById(node.childNodes[i], id);
            if (found) return found;
          }
        }
        return null;
      }

      function findSignedInfo(node: any): any {
        if (node.nodeType === 1 && node.localName === 'SignedInfo') return node;
        if (node.childNodes) {
          for (let i = 0; i < node.childNodes.length; i++) {
            const found = findSignedInfo(node.childNodes[i]);
            if (found) return found;
          }
        }
        return null;
      }

      // 6. Hashear Referencias CON ancestorNamespaces (Inclusive C14N hereda xmlns del padre)
      const keyInfoNode = findNodeById(
        fullDoc.documentElement,
        `${sigId}-KeyInfo`,
      );
      const signedPropsNode = findNodeById(
        fullDoc.documentElement,
        signedPropsId,
      );

      const keyInfoAncestorNs = collectAncestorNamespaces(keyInfoNode);
      const signedPropsAncestorNs = collectAncestorNamespaces(signedPropsNode);

      const keyInfoContextC14n = c14n.process(keyInfoNode, {
        ancestorNamespaces: keyInfoAncestorNs,
      });
      const signedPropsContextC14n = c14n.process(signedPropsNode, {
        ancestorNamespaces: signedPropsAncestorNs,
      });

      const keyInfoDigest = crypto
        .createHash('sha256')
        .update(keyInfoContextC14n)
        .digest('base64');
      const signedPropsDigest = crypto
        .createHash('sha256')
        .update(signedPropsContextC14n)
        .digest('base64');

      // 7. Reemplazar Hashes en el XML string y volver a parsear para extraer SignedInfo
      const updatedMockFinalXml = mockFinalXml
        .replace('KEYINFO_PLACEHOLDER', keyInfoDigest)
        .replace('SIGNEDPROPS_PLACEHOLDER', signedPropsDigest);

      const updatedFullDoc = parser.parseFromString(
        updatedMockFinalXml,
        'text/xml',
      );

      // 8. Hashear SignedInfo contextualizado CON ancestorNamespaces y Generar Firma
      const signedInfoNode = findSignedInfo(updatedFullDoc.documentElement);
      const signedInfoAncestorNs = collectAncestorNamespaces(signedInfoNode);
      const signedInfoContextC14n = c14n.process(signedInfoNode, {
        ancestorNamespaces: signedInfoAncestorNs,
      });

      this.logger.debug(
        'C14N SignedInfo (primeros 500 chars): ' +
          signedInfoContextC14n.substring(0, 500),
      );

      const sign = crypto.createSign('RSA-SHA256');
      sign.update(signedInfoContextC14n);
      sign.end();
      const signatureValue = sign.sign(creds.privateKey, 'base64');

      // 9. Reemplazo final
      return updatedMockFinalXml.replace('SIG_PLACEHOLDER', signatureValue);
    } catch (error) {
      this.logger.error(`Error firmando XML: ${error.message}`);
      throw error;
    }
  }
}
