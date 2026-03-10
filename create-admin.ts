import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const email = 'julymanrij@gmail.com';
    const login = 'julymanrij';
    const name = 'July Admin';
    const phone = '0000000000';
    const password = await bcrypt.hash('admin123', 10);

    // Fix sequence issue if any
    await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('user_app', 'id_user_app'), COALESCE((SELECT MAX(id_user_app) FROM user_app), 1) + 1, false);`;

    const existingUser = await prisma.userApp.findUnique({ where: { email } });
    let user = existingUser;

    if (!existingUser) {
        // Create UserApp
        user = await prisma.userApp.create({
            data: {
                email,
                login,
                name,
                phone,
                password
            }
        });
    }

    // Get Admin role (id: 1)
    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });

    if (adminRole && user) {
        // Link user to role if not already
        const existingUserRole = await prisma.userRole.findFirst({
            where: {
                id_user_app: user.id,
                id_role: adminRole.id
            }
        });

        if (!existingUserRole) {
            await prisma.userRole.create({
                data: {
                    id_user_app: user.id,
                    id_role: adminRole.id
                }
            });
            console.log(`User ${email} created and assigned Admin role.`);
        } else {
            console.log(`User ${email} already has Admin role.`);
        }
    } else {
        console.error("Admin role not found!");
    }
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
