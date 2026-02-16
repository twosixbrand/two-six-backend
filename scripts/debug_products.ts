import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugProducts() {
    console.log('--- Debugging Products for Men ---');

    // 1. Check if any Gender exists with name 'MASCULINO'
    const gender = await prisma.gender.findFirst({ where: { name: 'MASCULINO' } });
    console.log('Gender MASCULINO:', gender);

    if (!gender) {
        console.log('No gender found with name MASCULINO');
        return;
    }

    // 2. Check if any Clothing is linked to this Gender
    const clothingItems = await prisma.clothing.findMany({
        where: { id_gender: gender.id },
        include: { gender: true }
    });
    console.log(`Found ${clothingItems.length} clothing items linked to MASCULINO`);

    if (clothingItems.length === 0) return;

    // 3. Loop through ALL clothing items
    for (const c of clothingItems) {
        const clothingId = c.id;
        console.log(`Checking deep chain for Clothing ID ${clothingId} (${c.name})`);

        // 4. Check Designs for this clothing
        const designs = await prisma.design.findMany({
            where: { id_clothing: clothingId },
            include: { clothingColors: true }
        });
        console.log(`Found ${designs.length} designs for this clothing.`);

        for (const d of designs) {
            console.log(`  Design ID ${d.id} (${d.reference})`);

            for (const cc of d.clothingColors) {
                // 5. Check ClothingSizes (Product Variant base)
                const sizes = await prisma.clothingSize.findMany({
                    where: { id_clothing_color: cc.id },
                    include: { product: true }
                });
                console.log(`    Color ID ${cc.id}: ${sizes.length} sizes`);

                for (const s of sizes) {
                    if (s.product) {
                        console.log(`      Size ID ${s.id}: Product ID ${s.product.id} [Active=${s.product.active}, Outlet=${s.product.is_outlet}, Stock=${s.quantity_available}]`);
                    } else {
                        console.log(`      Size ID ${s.id}: No Product`);
                    }
                }
            }
        }
    }

    console.log('--- End Debug ---');
}

debugProducts()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
