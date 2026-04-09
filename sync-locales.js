const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const envProd = fs.readFileSync('.env.prod', 'utf8');
const matchProd = envProd.match(/DATABASE_URL=(.*)/);
const prodUrl = matchProd[1].trim();

const prodPrisma = new PrismaClient({ datasourceUrl: prodUrl });
const localPrisma = new PrismaClient();

async function main() {
  console.log('Conectando a producción y local para migrar departamentos y ciudades...\n');

  const copyOrder = [
    { name: 'department', model: 'department' },
    { name: 'city', model: 'city' },
  ];

  let totalCopied = 0;

  for (const entry of copyOrder) {
    try {
      const data = await prodPrisma[entry.model].findMany();
      if (data.length === 0) {
        console.log(`  ⏭ ${entry.name}: vacía`);
        continue;
      }

      let inserted = 0;
      for (const record of data) {
        try {
          // ensure the values are inserted correctly
          await localPrisma[entry.model].upsert({
            where: { id: record.id },
            update: record,
            create: record
          });
          inserted++;
        } catch (e) {
          if (inserted === 0) {
            console.log(`    ⚠ ${entry.name} error: ${e.message?.substring(0, 120)}`);
          }
        }
      }
      console.log(`  ✓ ${entry.name}: ${inserted}/${data.length}`);
      totalCopied += inserted;
    } catch (e) {
      console.log(`  ✗ ${entry.name}: ${e.message?.substring(0, 100)}`);
    }
  }

  // Reseteando sequences si logramos insertar todo (Department/City sequence starts max+1)
  console.log('Reset sequences locales');
  for(const table of ['department', 'city']) {
      try {
        await localPrisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 0) + 1, false)`
        );
      } catch(e) {}
  }

  console.log(`\n✅ Migración de locaciones completada. ${totalCopied} registros sincronizados en total.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prodPrisma.$disconnect();
    await localPrisma.$disconnect();
  });
