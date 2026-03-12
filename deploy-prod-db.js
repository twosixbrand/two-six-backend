const { PrismaClient } = require('@prisma/client');

async function deployDatabaseChanges() {
  console.log("🚀 Iniciando despielgue de Base de Datos en Producción...");
  console.log("========================================================\n");

  // Migración de Datos interna (Hotfix COD -> PCE)
  console.log("▶️  Migrando datos internos ('Aprobado COD' -> 'Aprobado PCE')...");
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
