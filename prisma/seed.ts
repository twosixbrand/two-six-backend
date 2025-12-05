import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const sqlPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log('Seeding database from seed.sql...');

    // Execute the SQL file
    // Note: executeRawUnsafe might not support multiple statements depending on configuration,
    // but for Postgres it often works if passed as a single string.
    // If it fails, we might need to split by semicolon.
    try {
        await prisma.$executeRawUnsafe(sql);
        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Error executing seed.sql:', error);
        // Fallback: try splitting by semicolon if the error suggests syntax error near ";"
        console.log('Attempting to split statements...');
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        for (const statement of statements) {
            try {
                await prisma.$executeRawUnsafe(statement);
            } catch (innerError) {
                console.error('Error executing statement:', statement, innerError);
            }
        }
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
