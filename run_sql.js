const { Client } = require('pg');
const fs = require('fs');

const envProd = fs.readFileSync('.env.prod', 'utf8');
const match = envProd.match(/DATABASE_URL=(.*)/);
const dbUrl = match[1].trim();

console.log('Connecting to', dbUrl.substring(0, 30) + '...');

const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query('ALTER TABLE "clothing_color" ADD COLUMN IF NOT EXISTS "slug" TEXT;');
    console.log('Slug column added to PROD database');
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
