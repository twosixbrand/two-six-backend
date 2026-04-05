const { Client } = require('pg');
const fs = require('fs');
const envProd = fs.readFileSync('.env.prod', 'utf8');
const match = envProd.match(/DATABASE_URL=(.*)/);
const dbUrl = match[1].trim();

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE "clothing_color" ADD COLUMN IF NOT EXISTS "seo_title" TEXT;');
    await client.query('ALTER TABLE "clothing_color" ADD COLUMN IF NOT EXISTS "seo_desc" TEXT;');
    await client.query('ALTER TABLE "clothing_color" ADD COLUMN IF NOT EXISTS "seo_h1" TEXT;');
    await client.query('ALTER TABLE "clothing_color" ADD COLUMN IF NOT EXISTS "seo_alt" TEXT;');
    console.log('Columnas SEO añadidas a la base de datos de producción.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
