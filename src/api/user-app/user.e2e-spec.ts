import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('UserAppController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Limpiar tablas relacionadas antes de las pruebas
    await prisma.userRole.deleteMany();
    await prisma.userApp.deleteMany();
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany();
    await prisma.userApp.deleteMany();
    await app.close();
  });

  describe('/user-app (POST)', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/user-app')
        .send({ login: 'testuser', name: 'Test User' })
        .expect(201)
        .then((res) => {
          expect(res.body).toEqual({
            code_user: expect.any(Number),
            login: 'testuser',
            name: 'Test User',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });
  });

  describe('/user-app (GET)', () => {
    it('should return an array of users', async () => {
      await prisma.userApp.create({
        data: { login: 'viewer', name: 'Viewer User' },
      });

      return request(app.getHttpServer())
        .get('/user-app')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('login');
        });
    });
  });

  it('should handle the full CRUD lifecycle for a user', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/user-app')
      .send({ login: 'editor', name: 'Editor User' })
      .expect(201);

    const userId = createRes.body.code_user;
    expect(createRes.body.name).toBe('Editor User');

    // 2. Read
    await request(app.getHttpServer()).get(`/user-app/${userId}`).expect(200);

    // 3. Update
    await request(app.getHttpServer()).patch(`/user-app/${userId}`).send({ name: 'Commentator User' }).expect(200);

    // 4. Delete
    await request(app.getHttpServer()).delete(`/user-app/${userId}`).expect(200);

    // 5. Verify Deletion
    await request(app.getHttpServer()).get(`/user-app/${userId}`).expect(404);
  });
});