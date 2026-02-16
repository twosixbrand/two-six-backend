import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const designsWithImages = await prisma.design.findMany({
        where: {
            image_url: {
                not: null
            }
        },
        select: {
            id: true,
            reference: true,
            image_url: true
        }
    });

    console.log('Designs with images:', designsWithImages);

    const allDesigns = await prisma.design.findMany({
        take: 5,
        select: { id: true, reference: true, image_url: true }
    });
    console.log('Sample of first 5 designs:', allDesigns);
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
