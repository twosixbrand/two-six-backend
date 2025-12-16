import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from '../src/api/order/order.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

async function verifyOrdersEndpoint() {
    console.log('Initializing verification for Orders Endpoint...');

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            OrderService,
            PrismaService,
            {
                provide: MailerService,
                useValue: { sendMail: async () => true },
            },
            {
                provide: ConfigService,
                useValue: {
                    get: (key: string) => {
                        if (key === 'WOMPI_INTEGRITY_SECRET') return 'test_integrity_secret';
                        if (key === 'WOMPI_PUBLIC_KEY') return 'test_public_key';
                        return null;
                    },
                },
            },
        ],
    }).compile();

    const orderService = module.get<OrderService>(OrderService);
    const prismaService = module.get<PrismaService>(PrismaService);

    // 1. Create a test customer and order
    const testEmail = `test-orders-${Date.now()}@example.com`;
    const customer = await prismaService.customer.create({
        data: {
            name: 'Test Customer Orders',
            email: testEmail,
            current_phone_number: '1234567890',
            shipping_address: 'Test Address',
            city: 'Test City',
            state: 'Test State',
            postal_code: '12345',
            country: 'Test Country',
            responsable_for_vat: false,
            customerType: { connectOrCreate: { where: { id: 1 }, create: { name: 'Persona Natural' } } },
            identificationType: { connectOrCreate: { where: { id: 1 }, create: { name: 'CC', code: 'CC' } } },
        },
    });

    const order = await prismaService.order.create({
        data: {
            id_customer: customer.id,
            order_date: new Date(),
            status: 'Pendiente',
            iva: 0,
            shipping_cost: 0,
            total_payment: 10000,
            purchase_date: new Date(),
            is_paid: false,
            shipping_address: 'Test Address',
        },
    });

    try {
        // 2. Fetch orders by email
        console.log('Fetching orders for:', testEmail);
        const orders = await orderService.findByCustomerEmail(testEmail);

        console.log('Orders found:', orders.length);
        if (orders.length > 0) {
            console.log('First Order ID:', orders[0].id);
            console.log('First Order Status:', orders[0].status);
        } else {
            throw new Error('No orders found');
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        await prismaService.order.delete({ where: { id: order.id } });
        await prismaService.customer.delete({ where: { email: testEmail } });
        await prismaService.$disconnect();
    }
}

verifyOrdersEndpoint();
