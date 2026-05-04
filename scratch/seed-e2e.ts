import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.userApp.upsert({
    where: { email: 'twosixmarca@gmail.com' },
    update: {},
    create: {
      email: 'twosixmarca@gmail.com',
      name: 'E2E Tester',
      login: 'twosixe2e',
      phone: '0000000000',
    },
  });
  console.log('User created/ensured:', user.email);
  await prisma.$disconnect();
}

main();
