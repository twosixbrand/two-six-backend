import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = await prisma.role.findMany();
    console.log("Roles in DB:", roles);

    // Check if user already exists
    const existingUser = await prisma.userApp.findUnique({ where: { email: 'julymanrij@gmail.com' } });
    console.log("Existing user:", existingUser);
}

main().catch(console.error).finally(() => prisma.$disconnect());
