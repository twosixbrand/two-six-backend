import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { MailerService } from '@nestjs-modules/mailer';
import { ThrottlerGuard } from '@nestjs/throttler';

describe('Backend E2E Tests', () => {
  let app: INestApplication;

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue({}),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailerService)
      .useValue(mockMailerService)
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: () => true }) // Disable throttling for tests
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/api (GET)', async () => {
      const response = await request(app.getHttpServer())
        .get('/api')
        .expect(200);
      expect(response.text).toBe('Hello World!');
    });
  });

  describe('Auth Flow (E2E Bypass)', () => {
    it('should generate OTP via /api/auth/login (Bypass)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'twosixmarca@gmail.com' });
      
      if (response.status === 404) {
        console.log('404 Body:', response.body);
      }
      
      expect(response.status).toBe(200);
      expect(response.body.message).toContain('código OTP');
    });

    it('should login via /api/auth/verify-otp (Bypass)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/verify-otp')
        .send({ email: 'twosixmarca@gmail.com', otp: '999999' })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
    });
  });

  describe('Master Data (Tags)', () => {
    it('/api/tags (GET) - Public access', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tags')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
