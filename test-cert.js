const crypto = require('crypto');
const fs = require('fs');

async function test() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  const config = await prisma.systemConfig.findFirst({where: { key: 'DIAN_CERTIFICATE_B64' }});
  
  if (config && config.value) {
    const certBase64 = config.value.replace(/-----BEGIN CERTIFICATE-----/g, '').replace(/-----END CERTIFICATE-----/g, '').replace(/\n/g, '');
    const der = Buffer.from(certBase64, 'base64');
    // wrap in PEM
    const pem = `-----BEGIN CERTIFICATE-----\n${der.toString('base64')}\n-----END CERTIFICATE-----\n`;
    const cert = new crypto.X509Certificate(pem);
    console.log("Issuer:", cert.issuer);
    console.log("Serial Number:", cert.serialNumber);
    // DIAN needs decimal serial number. crypto.serialNumber is hex.
    const serialHex = cert.serialNumber.replace(/:/g, '');
    const serialDec = BigInt('0x' + serialHex).toString();
    console.log("Serial Decimal:", serialDec);
  }
}
test();
