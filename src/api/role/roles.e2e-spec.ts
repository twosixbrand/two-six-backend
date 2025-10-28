import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('RolesController (e2e)', () => {
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

    // Limpiar la tabla antes de las pruebas
    await prisma.userRole.deleteMany();
    await prisma.role.deleteMany();
  });

  afterAll(async () => {
    await prisma.userRole.deleteMany();
    await prisma.role.deleteMany();
    await app.close();
  });

  describe('/roles (POST)', () => {
    it('should create a new role', () => {
      return request(app.getHttpServer())
        .post('/roles')
        .send({ name: 'Test Role' })
        .expect(201)
        .then((res) => {
          expect(res.body).toEqual({
            code_role: expect.any(Number),
            name: 'Test Role',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });
  });

  describe('/roles (GET)', () => {
    it('should return an array of roles', async () => {
      // Primero, crea un rol para asegurarte de que la lista no esté vacía
      await prisma.role.create({ data: { name: 'Viewer' } });

      return request(app.getHttpServer())
        .get('/roles')
        .expect(200)
        .then((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('name');
        });
    });
  });

  it('should handle the full CRUD lifecycle', async () => {
    // 1. Create
    const createRes = await request(app.getHttpServer())
      .post('/roles')
      .send({ name: 'Editor' })
      .expect(201);

    const roleId = createRes.body.code_role;
    expect(createRes.body.name).toBe('Editor');

    // 2. Read
    await request(app.getHttpServer()).get(`/roles/${roleId}`).expect(200);

    // 3. Update
    await request(app.getHttpServer()).patch(`/roles/${roleId}`).send({ name: 'Commentator' }).expect(200);

    // 4. Delete
    await request(app.getHttpServer()).delete(`/roles/${roleId}`).expect(200);

    // 5. Verify Deletion
    await request(app.getHttpServer()).get(`/roles/${roleId}`).expect(404);
  });
});
