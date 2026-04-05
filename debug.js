const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const envProd = fs.readFileSync('.env.prod', 'utf8');
const match = envProd.match(/DATABASE_URL=(.*)/);
const dbUrl = match[1].trim();

const prisma = new PrismaClient({
  datasourceUrl: dbUrl
});

async function run() {
  const cc = await prisma.clothingColor.findMany({
    include: {
      color: true,
      design: {
        include: { clothing: true }
      }
    }
  });

  cc.forEach(c => {
     console.log(`ID: ${c.id} | Slug: ${c.slug} | Ref: ${c.design?.reference} | Name: ${c.design?.clothing?.name}`);
  });
}
run().catch(console.error).finally(() => prisma.$disconnect());
