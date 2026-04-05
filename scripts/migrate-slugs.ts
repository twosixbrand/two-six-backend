import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const generateSlug = (text: string) => {
  return text
    .toString()
    .normalize('NFD') // Normaliza caracteres unicode
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Reemplaza espacios con -
    .replace(/[^\w\-]+/g, '') // Elimina caracteres no alfanuméricos
    .replace(/\-\-+/g, '-'); // Reemplaza múltiples - con uno solo
};

async function main() {
  console.log('Iniciando migración de slugs para ClothingColor...');

  // 1. Obtener todos los ClothingColor existentes para reemplazarlos
  const clothingColors = await prisma.clothingColor.findMany({
    include: {
      design: {
        include: {
          clothing: true,
        },
      },
      color: true,
    },
  });

  console.log(`Encontrados ${clothingColors.length} colores de prenda sin slug.`);

  // 2. Iterar sobre ellos y crear el slug
  for (const cc of clothingColors) {
    if (!cc.design || !cc.design.clothing || !cc.color) {
      console.warn(`Saltando ClothingColor #${cc.id} por falta de relaciones (Design/Clothing/Color)`);
      continue;
    }

    // El slug estará basado ahora solamente en: nombre-prenda + nombre-color
    const rawName = `${cc.design.clothing.name} ${cc.color.name}`;
    let baseSlug = generateSlug(rawName);

    // Evitar colisiones de slugs añadiendo el ID si es necesario
    let finalSlug = baseSlug;
    let attempts = 0;
    while (true) {
      const existing = await prisma.clothingColor.findUnique({
        where: { slug: finalSlug },
      });
      if (!existing || existing.id === cc.id) {
        break; // Unique o pertenece a sí mismo
      }
      attempts++;
      finalSlug = `${baseSlug}-${attempts}`;
    }

    // 3. Actualizar la base de datos
    await prisma.clothingColor.update({
      where: { id: cc.id },
      data: { slug: finalSlug },
    });
    
    console.log(`Actualizado CC #${cc.id} -> ${finalSlug}`);
  }

  console.log('Migración completada.');
}

main()
  .catch((e) => {
    console.error('Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
