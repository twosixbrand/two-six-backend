const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');

async function deployDatabaseChanges() {
  console.log("🚀 Iniciando despliegue de Base de Datos en Producción...");
  console.log("========================================================\n");

  // 1. Despliegue de esquema estructural de Prisma
  console.log("1️⃣  Ejecutando Migraciones Estructurales de Prisma (npx prisma migrate deploy)...");
  try {
    // Esto aplicará cualquier archivo .sql de la carpeta prisma/migrations que falte en Producción
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log("✅ Migraciones de esquema aplicadas correctamente.\n");
  } catch (err) {
    console.error("❌ Error aplicando las migraciones de Prisma. Verifica tu .env de producción.");
    process.exit(1);
  }

  // 2. Migración de Datos interna (Hotfix COD -> PCE)
  console.log("2️⃣  Migrando datos internos ('Aprobado COD' -> 'Aprobado PCE')...");
  const prisma = new PrismaClient();
  try {
    const result = await prisma.order.updateMany({
      where: { status: 'Aprobado COD' },
      data: { status: 'Aprobado PCE' },
    });
    console.log(`✅ ¡Éxito! Se han purgado y actualizado ${result.count} órdenes antiguas a la nueva nomenclatura PCE.\n`);
  } catch (error) {
    console.error('❌ Error ejecutando la migración de datos internos:', error.message);
  } finally {
    await prisma.$disconnect();
  }

  console.log("🎉 Despliegue de Base de Datos finalizado de manera segura. Ya puedes reiniciar la API.");
}

deployDatabaseChanges();
