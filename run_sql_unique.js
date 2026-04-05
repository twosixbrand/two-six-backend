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
    await client.query('ALTER TABLE "clothing_color" ADD CONSTRAINT "clothing_color_slug_key" UNIQUE ("slug");');
    console.log('Unique constraint added to slug column in PROD');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
