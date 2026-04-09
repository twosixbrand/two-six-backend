/**
 * Script para clonar datos de producción a la base de datos local.
 * Desactiva constraints FK durante la copia para evitar conflictos.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const envProd = fs.readFileSync('.env.prod', 'utf8');
const matchProd = envProd.match(/DATABASE_URL=(.*)/);
const prodUrl = matchProd[1].trim();

const prodPrisma = new PrismaClient({ datasourceUrl: prodUrl });
const localPrisma = new PrismaClient();

async function main() {
  console.log('Conectando a producción y local...\n');

  // 1. Limpiar todo sin restricciones
  console.log('🗑️  Limpiando base de datos local...');
  await localPrisma.$executeRawUnsafe('SET session_replication_role = replica;');
  const allTables = await localPrisma.$queryRawUnsafe(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' AND tablename != '_prisma_migrations'
  `);
  for (const t of allTables) {
    await localPrisma.$executeRawUnsafe(`TRUNCATE TABLE "${t.tablename}" CASCADE`);
  }
  console.log('✓ Todas las tablas vaciadas\n');

  // 2. Copiar datos tabla por tabla con constraints desactivadas
  const copyOrder = [
    { name: 'gender', model: 'gender' },
    { name: 'category', model: 'category' },
    { name: 'typeClothing', model: 'typeClothing' },
    { name: 'color', model: 'color' },
    { name: 'size', model: 'size' },
    { name: 'provider', model: 'provider' },
    { name: 'productionType', model: 'productionType' },
    { name: 'yearProduction', model: 'yearProduction' },
    { name: 'customer', model: 'customer' },
    { name: 'clothing', model: 'clothing' },
    { name: 'collection', model: 'collection' },
    { name: 'design', model: 'design' },
    { name: 'designProvider', model: 'designProvider' },
    { name: 'clothingColor', model: 'clothingColor' },
    { name: 'imageClothing', model: 'imageClothing' },
    { name: 'clothingSize', model: 'clothingSize' },
    { name: 'product', model: 'product' },
    { name: 'order', model: 'order' },
    { name: 'orderItem', model: 'orderItem' },
    { name: 'dianEInvoicing', model: 'dianEInvoicing' },
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
          await localPrisma[entry.model].create({ data: record });
          inserted++;
        } catch (e) {
          // Log first error for debugging
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

  // 3. Reactivar constraints
  await localPrisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');

  // 4. Reset sequences para que los auto-increment funcionen
  console.log('\n🔄 Reseteando sequences...');
  for (const t of allTables) {
    try {
      // Get all serial columns for this table
      const seqs = await localPrisma.$queryRawUnsafe(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = '${t.tablename}' 
        AND column_default LIKE 'nextval%'
      `);
      for (const s of seqs) {
        await localPrisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${t.tablename}"', '${s.column_name}'), COALESCE((SELECT MAX("${s.column_name}") FROM "${t.tablename}"), 0) + 1, false)`
        );
      }
    } catch (e) {}
  }

  // Verificación final
  console.log('\n📊 Verificación:');
  const products = await localPrisma.product.count();
  const cc = await localPrisma.clothingColor.count();
  const designs = await localPrisma.design.count();
  console.log(`  Productos: ${products} | ClothingColors: ${cc} | Diseños: ${designs}`);
  console.log(`\n✅ Clonación completada. ${totalCopied} registros copiados en total.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prodPrisma.$disconnect();
    await localPrisma.$disconnect();
  });
