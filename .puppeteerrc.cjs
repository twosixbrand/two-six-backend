const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Configura la caché dentro de node_modules para asegurar persistencia en DigitalOcean
  cacheDirectory: join(__dirname, 'node_modules', '.puppeteer_cache'),
};
