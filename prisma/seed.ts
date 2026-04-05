import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function cloneFromProd() {
  console.log('Detectado .env.prod. Intentando clonar datos base desde producción para un entorno más realista...');
  const envProd = fs.readFileSync('.env.prod', 'utf8');
  const matchProd = envProd.match(/DATABASE_URL=(.*)/);
  if (!matchProd) {
    console.log('  No se encontró DATABASE_URL en .env.prod. Abortando clonación.');
    return false;
  }
  const prodUrl = matchProd[1].trim();
  const prodPrisma = new PrismaClient({ datasourceUrl: prodUrl });

  try {
    // Solo copiamos catálogos base para el seed. 
    // Los datos transaccionales (productos, ordenes) pueden ser muy pesados.
    const baseTables = [
      'gender', 'category', 'typeClothing', 'color', 'size', 'role', 
      'permission', 'customerType', 'identificationType', 'paymentMethod'
    ];

    for (const table of baseTables) {
      const pData = await prodPrisma[table as keyof PrismaClient].findMany() as any[];
      if (pData.length === 0) continue;

      let inserted = 0;
      for (const record of pData) {
        try {
          await (prisma[table as keyof PrismaClient] as any).create({ data: record });
          inserted++;
        } catch (e) {
          // Ignorar duplicados o errores
        }
      }
      console.log(`  ✓ ${table}: ${inserted} registros insertados.`);
    }
    
    // Crear usuario admin por defecto si no hay usuarios
    const userCount = await prisma.userApp.count();
    if (userCount === 0) {
      const hashed = await bcrypt.hash('admin123', 10);
      const admin = await prisma.userApp.create({
        data: {
          name: 'Admin Local',
          login: 'admin',
          email: 'admin@twosix.local',
          phone: '0000000000',
          password: hashed,
        }
      });
      // Asignar rol (asumiendo que el ID 1 es Admin, clonado arriba)
      try {
        await prisma.userRole.create({
          data: { id_user_app: admin.id, id_role: 1 }
        });
      } catch (e) {}
      console.log('  ✓ Usuario admin creado (admin / admin123)');
    }

    return true;
  } catch (error) {
    console.log('  ⚠ Falló la conexión a producción. Procediendo con seed básico local.', error);
    return false;
  } finally {
    await prodPrisma.$disconnect();
  }
}

async function minSeed() {
  console.log('Insertando catálogos básicos mediante Prisma (idempotente)...');

  // Roles
  await prisma.role.createMany({
    data: [
      { id: 1, name: 'Admin', description: 'Administrador con todos los permisos' },
      { id: 2, name: 'Manager', description: 'Gerente de tienda' },
    ],
    skipDuplicates: true,
  });

  // Usuario Admin Dummy
  const userCount = await prisma.userApp.count();
  if (userCount === 0) {
    const hashed = await bcrypt.hash('admin123', 10);
    const admin = await prisma.userApp.create({
      data: {
        name: 'Admin Local',
        login: 'admin',
        email: 'admin@twosix.local',
        phone: '0000000000',
        password: hashed,
      }
    });
    await prisma.userRole.create({
      data: { id_user_app: admin.id, id_role: 1 }
    });
  }

  // Tallas
  await prisma.size.createMany({
    data: [
      { id: 1, name: 'S', description: 'Pequeña' },
      { id: 2, name: 'M', description: 'Mediana' },
      { id: 3, name: 'L', description: 'Grande' },
    ],
    skipDuplicates: true,
  });

  // Colores
  await prisma.color.createMany({
    data: [
      { id: 1, name: 'Negro', hex: '#000000' },
      { id: 2, name: 'Blanco', hex: '#FFFFFF' },
    ],
    skipDuplicates: true,
  });

  console.log('✓ Semilla local básica completada.');
}

async function main() {
  // Intentar clonar la base primero de producción (más realista)
  let clonedFromProd = false;
  try {
    if (fs.existsSync('.env.prod')) {
      clonedFromProd = await cloneFromProd();
    }
  } catch (e) {
    console.log('⚠ Error leyendo .env.prod', e);
  }

  // Si no se clonó (no hay .env.prod o falló la conexión), usar seed estático
  if (!clonedFromProd) {
    await minSeed();
  }

  console.log('Seeding completado con Prisma ORM, a prueba de cambios menores de schema.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
