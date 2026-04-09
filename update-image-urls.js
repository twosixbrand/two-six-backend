const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando actualización de URLs de imágenes...');

  try {
    // Usamos REPLACE de SQL para actualizar todas las URLs masivamente
    const result = await prisma.$executeRaw`
      UPDATE "image_clothing" 
      SET "image_url" = REPLACE("image_url", 'PROD', 'DLLO')
      WHERE "image_url" LIKE '%PROD%';
    `;
    
    console.log(`✓ Actualización completada. ${result} registros modificados.`);
  } catch (error) {
    console.error('Error actualizando los registros:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
