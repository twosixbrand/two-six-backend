import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth/auth.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as bcrypt from 'bcrypt';

async function verifyCustomerLogin() {
    console.log('Initializing verification for Customer Login...');

    const module: TestingModule = await Test.createTestingModule({
        providers: [
            AuthService,
            PrismaService,
            {
                provide: JwtService,
                useValue: {
                    sign: (payload) => 'mock_token',
                },
            },
            {
                provide: MailerService,
                useValue: {
                    sendMail: async (options) => {
                        console.log('Mock Email Sent to:', options.to);
                        console.log('Subject:', options.subject);
                        // Extract OTP from HTML for verification
                        const match = options.html.match(/>(\d{6})<\/h2>/);
                        if (match) {
                            console.log('Extracted OTP:', match[1]);
                            process.env.TEST_OTP = match[1];
                        }
                        return true;
                    },
                },
            },
        ],
    }).compile();

    const authService = module.get<AuthService>(AuthService);
    const prismaService = module.get<PrismaService>(PrismaService);

    // 1. Create a test customer if not exists
    const testEmail = `test-customer-${Date.now()}@example.com`;
    await prismaService.customer.create({
        data: {
            name: 'Test Customer',
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

    try {
        // 2. Request OTP
        console.log('Requesting OTP...');
        await authService.loginCustomer(testEmail);

        // 3. Verify OTP
        const otp = process.env.TEST_OTP;
        if (!otp) {
            throw new Error('OTP not captured from email mock');
        }
        console.log('Verifying OTP:', otp);

        const result = await authService.verifyCustomerOtp(testEmail, otp);
        console.log('Login Successful!');
        console.log('Access Token:', result.accessToken);
        console.log('Customer:', result.customer);

        if (!result.customer.current_phone_number || !result.customer.shipping_address) {
            throw new Error('Customer profile data is missing in the response');
        }
        console.log('Profile data verification successful!');

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    } finally {
        // Cleanup
        await prismaService.customer.delete({ where: { email: testEmail } });
        await prismaService.$disconnect();
    }
}

verifyCustomerLogin();
