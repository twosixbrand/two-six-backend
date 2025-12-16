import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyAddressManagement() {
    console.log('Initializing verification for Address Management...');

    try {
        // 1. Create a test customer
        const email = `test-address-${Date.now()}@example.com`;
        const customer = await prisma.customer.create({
            data: {
                name: 'Address Tester',
                email: email,
                current_phone_number: '5555555555',
                shipping_address: 'Main St',
                city: 'Test City',
                state: 'Test State',
                postal_code: '12345',
                country: 'Test Country',
                id_customer_type: 1, // Assuming 1 exists
                id_identification_type: 1, // Assuming 1 exists
                responsable_for_vat: false,
            }
        });
        console.log('Created customer:', customer.id);

        // 2. Add an address
        const address1 = await prisma.address.create({
            data: {
                id_customer: customer.id,
                address: '123 Side St',
                city: 'Side City',
                state: 'Side State',
                postal_code: '54321',
                country: 'Side Country',
                is_default: true,
            }
        });
        console.log('Created address 1:', address1.id);

        // 3. Add another address
        const address2 = await prisma.address.create({
            data: {
                id_customer: customer.id,
                address: '456 Other St',
                city: 'Other City',
                state: 'Other State',
                postal_code: '67890',
                country: 'Other Country',
                is_default: false,
            }
        });
        console.log('Created address 2:', address2.id);

        // 4. Verify addresses
        const addresses = await prisma.address.findMany({
            where: { id_customer: customer.id }
        });
        console.log('Found addresses:', addresses.length);

        if (addresses.length !== 2) {
            throw new Error('Expected 2 addresses');
        }

        // 5. Clean up
        await prisma.address.deleteMany({ where: { id_customer: customer.id } });
        await prisma.customer.delete({ where: { id: customer.id } });
        console.log('Clean up successful');

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyAddressManagement();
