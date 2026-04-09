const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const products = await prisma.product.count();
  const clothingColors = await prisma.clothingColor.count();
  const designs = await prisma.design.count();
  const clothing = await prisma.clothing.count();
  const colors = await prisma.color.count();
  const sizes = await prisma.size.count();

  console.log('=== Estado de la Base de Datos LOCAL ===');
  console.log(`Productos:       ${products}`);
  console.log(`Clothing Colors: ${clothingColors}`);
  console.log(`Diseños:         ${designs}`);
  console.log(`Prendas:         ${clothing}`);
  console.log(`Colores:         ${colors}`);
  console.log(`Tallas:          ${sizes}`);
}
check().catch(console.error).finally(() => prisma.$disconnect());
