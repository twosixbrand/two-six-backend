import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.userApp.findMany({ select: { email: true } });
  console.log('Users:', users);
  await prisma.$disconnect();
}

main();
