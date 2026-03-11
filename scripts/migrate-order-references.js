const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function generateOrderReference(date) {
  // Format: TS-YYMMDD-[4 random digits]
  const d = new Date(date);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  
  const randomStr = String(Math.floor(1000 + Math.random() * 9000));
  
  return `TS-${yy}${mm}${dd}-${randomStr}`;
}

async function main() {
  console.log('Iniciando migración de order_reference retrospectiva...');

  const orders = await prisma.order.findMany({
    where: {
      order_reference: null
    }
  });

  console.log(`Se encontraron ${orders.length} pedidos sin order_reference.`);

  let updatedCount = 0;

  for (const order of orders) {
    let referencedGenerated = false;
    let attempts = 0;
    let newReference = '';

    while (!referencedGenerated && attempts < 10) {
      newReference = generateOrderReference(order.createdAt);
      
      // Check collision
      const exists = await prisma.order.findUnique({
        where: { order_reference: newReference }
      });

      if (!exists) {
        referencedGenerated = true;
      }
      attempts++;
    }

    if (!referencedGenerated) {
       console.error(`No se pudo generar una referencia única para el pedido ID ${order.id} después de 10 intentos.`);
       continue;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { order_reference: newReference }
    });

    updatedCount++;
    if (updatedCount % 10 === 0) {
       console.log(`Progreso: ${updatedCount}/${orders.length} pedidos actualizados.`);
    }
  }

  console.log(`Migración completada. ${updatedCount} pedidos actualizados exitosamente.`);
}

main()
  .catch((e) => {
    console.error('Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
