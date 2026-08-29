const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando borrado de ventas POS (pos_sale)...');
  
  // Usar TRUNCATE para borrar todos los registros y reiniciar el contador de ID a 1
  // CASCADE asegura que si hay dependencias se manejen adecuadamente.
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE pos_sale RESTART IDENTITY CASCADE;`);
  
  console.log('¡Éxito! Todas las ventas de POS han sido eliminadas y el ID se ha reiniciado a 1.');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
