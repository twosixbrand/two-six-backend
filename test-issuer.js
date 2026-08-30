const crypto = require('crypto');
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
const cert = new crypto.X509Certificate(crypto.createSign('sha256').update('dummy').sign(privateKey)); // This is invalid
