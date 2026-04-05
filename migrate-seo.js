/**
 * Script para migrar los valores del seoDictionary.ts al campo SEO de la base de datos.
 * Se ejecuta una sola vez para poblar los campos seo_title, seo_desc, seo_h1, seo_alt
 * en la tabla clothing_color de producción.
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const envProd = fs.readFileSync('.env.prod', 'utf8');
const match = envProd.match(/DATABASE_URL=(.*)/);
const dbUrl = match[1].trim();

const prisma = new PrismaClient({ datasourceUrl: dbUrl });

// Diccionario SEO (copiado de seoDictionary.ts)
function getSeoOverrides(reference, colorName, gender) {
  const ref = (reference || '').toLowerCase().trim();
  const color = (colorName || '').toLowerCase().trim();
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const colorCapitalized = capitalize(color);

  // Q4A14 (Estampado Frontal y Manga)
  if (ref === 'q4a14') {
    return {
      title: `Camiseta ${colorCapitalized} Two Six - Estampado Naranja y Blanco | Crafted for Real Ones`,
      description: `Compra la Camiseta Estampada Two Six para hombre en color ${color}. Calidad premium con diseño exclusivo "Crafted for real ones". Envíos a todo el país.`,
      h1: `Camiseta Masculina - Estampado Frontal y Manga (Color ${colorCapitalized})`,
      alt: `Hombre vistiendo camiseta ${color} Two Six con logo naranja y eslogan Crafted for real ones`,
    };
  }

  // Q4A11 (Essentials Unisex)
  if (ref === 'q4a11') {
    return {
      title: `Camiseta Essentials Unisex ${colorCapitalized} - Logo Gorila Minimalista | Two Six`,
      description: `Descubre la Camiseta Essentials de Two Six. Un básico premium de corte unisex en color ${color} con nuestro icónico gorila en el pecho. Comodidad y estilo para el diario. Crafted for real ones.`,
      h1: `Camiseta Essentials - Edición Unisex (${colorCapitalized})`,
      alt: `Camiseta básica ${color} unisex de Two Six con pequeño logo de gorila bordado en el pecho`,
    };
  }

  // Q4A12 (Crop Top Femenino)
  if (ref === 'q4a12') {
    let altText = `Crop Top ${color} para mujer Two Six estilo urbano con eslogan Crafted for real ones.`;
    if (color === 'crudo' || color === 'blanco') altText = 'Mujer usando Crop Top color crudo Two Six con estampado frontal blanco.';
    else if (color === 'negro') altText = 'Crop Top negro femenino Two Six diseño minimalista algodón premium.';
    else if (color === 'gris') altText = 'Crop Top gris marca Two Six para mujer estilo casual urbano.';
    return {
      title: `Crop Top Estampado ${colorCapitalized} Two Six - Moda Urbana Femenina`,
      description: 'Eleva tu estilo urbano con el Crop Top de Two Six. Disponible en 4 colores esenciales: Crudo, Negro, Café y Gris. Diseño cómodo con estampado frontal exclusivo. Crafted for real ones.',
      h1: `Crop Top Essentials - ${colorCapitalized} (Edición Femenina)`,
      alt: altText,
    };
  }

  // Q4A13 (Essentials Mujer)
  if (ref === 'q4a13') {
    let altText = `Camiseta básica ${color} para mujer marca Two Six con logo minimalista del gorila.`;
    let titleColor = 'Mujer ' + colorCapitalized;
    if (color === 'crudo' || color === 'blanco') {
      altText = 'Mujer usando camiseta blanca/cruda de Two Six con pequeño logo de gorila en el pecho y chaqueta de jean.';
      titleColor = 'Mujer Cruda';
    } else if (color === 'negro') {
      altText = 'Camiseta básica negra para mujer marca Two Six con logo minimalista del gorila.';
      titleColor = 'Mujer Negra';
    }
    return {
      title: `Camiseta Essentials ${titleColor} - Logo Gorila Minimalista | Two Six`,
      description: 'Descubre la Camiseta Essentials para mujer de Two Six. Un básico premium con fit femenino en colores Negro y Crudo. Estilo minimalista con nuestro logo oficial del gorila. Crafted for real ones.',
      h1: `Camiseta Essentials - Edición Femenina (${colorCapitalized})`,
      alt: altText,
    };
  }

  // Q4A16 (Gorila en Espalda)
  if (ref === 'q4a16') {
    const isBlanca = color === 'crudo' || color === 'blanco';
    const title = isBlanca
      ? 'Camiseta Blanca Two Six - Estampado Gorila en Espalda | Two Six'
      : `Camiseta ${colorCapitalized} Two Six - Estampado Gorila en Espalda | Two Six`;
    return {
      title,
      description: 'Lleva el estilo auténtico de Two Six con nuestra camiseta premium. Destaca con el logo oficial del gorila estampado en la espalda. Crafted for real ones. Calidad y diseño de Medellín.',
      h1: `Camiseta ${colorCapitalized} - Edición Gorilla Logo (Espalda)`,
      alt: `Camiseta ${color} para ${gender} Two Six con ilustración de gorila con gorra amarilla estampada en la espalda`,
    };
  }

  // Q4A15 (Estampado Frente)
  if (ref === 'q4a15') {
    return {
      title: `Camiseta ${colorCapitalized} Two Six - Estampado Frontal Original | Two Six`,
      description: `Lleva el estilo auténtico de Two Six con nuestra camiseta estampada al frente en color ${color}. Diseño urbano y calidad premium. Crafted for real ones.`,
      h1: `Camiseta Masculina - Estampado Frontal Original (${colorCapitalized})`,
      alt: `Camiseta ${color} Two Six con estampado frontal exclusivo`,
    };
  }

  return null;
}

async function main() {
  console.log('Iniciando migración de SEO a la base de datos...');

  const clothingColors = await prisma.clothingColor.findMany({
    include: {
      color: true,
      design: {
        include: {
          clothing: {
            include: { gender: true }
          }
        }
      }
    }
  });

  let updated = 0;
  for (const cc of clothingColors) {
    const reference = cc.design?.reference || '';
    const colorName = cc.color?.name || '';
    const gender = cc.design?.clothing?.gender?.name || 'Unisex';

    const seo = getSeoOverrides(reference, colorName, gender);
    if (seo) {
      await prisma.clothingColor.update({
        where: { id: cc.id },
        data: {
          seo_title: seo.title,
          seo_desc: seo.description,
          seo_h1: seo.h1,
          seo_alt: seo.alt,
        }
      });
      console.log(`✓ CC #${cc.id} (${cc.slug}) → seo_h1: "${seo.h1}"`);
      updated++;
    } else {
      console.log(`✗ CC #${cc.id} (${cc.slug}) → Sin override SEO, saltando.`);
    }
  }

  console.log(`\nMigración completada. ${updated}/${clothingColors.length} actualizados.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
