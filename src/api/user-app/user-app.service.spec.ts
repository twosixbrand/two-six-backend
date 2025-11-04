import { Test, TestingModule } from '@nestjs/testing';
import { UserAppService } from './user-app.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateUserAppDto } from './dto/create-user-app.dto';
import { NotFoundException } from '@nestjs/common';
import { UserApp } from '@prisma/client';

// Mock de los datos que esperamos de la base de datos
const mockUser: UserApp = {
  id: 1,
  login: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  phone: '1234567890',
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Mock del PrismaService
const mockPrismaService = {
  userApp: {
    create: jest.fn().mockResolvedValue(mockUser),
    findMany: jest.fn().mockResolvedValue([mockUser]),
    findUnique: jest.fn().mockResolvedValue(mockUser),
    update: jest.fn().mockResolvedValue(mockUser),
    delete: jest.fn().mockResolvedValue(mockUser),
  },
};

describe('UserAppService', () => {
  let service: UserAppService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAppService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserAppService>(UserAppService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('should create a new user', async () => {
      const dto: CreateUserAppDto = {
        login: 'testuser',
        name: 'Test User',
        email: 'test@example.com',
        phone: '1234567890',
      };

      const result = await service.create(dto);

      expect(prisma.userApp.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll()', () => {
    it('should return an array of users with their roles', async () => {
      const result = await service.findAll();

      expect(prisma.userApp.findMany).toHaveBeenCalledWith({
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      expect(result).toEqual([mockUser]);
    });
  });

  describe('findOne()', () => {
    it('should return a single user with roles', async () => {
      const result = await service.findOne(1);

      expect(prisma.userApp.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw a NotFoundException if user does not exist', async () => {
      // Sobrescribimos el mock para este caso de prueba específico
      jest.spyOn(prisma.userApp, 'findUnique').mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update()', () => {
    it('should update a user', async () => {
      const dto: UpdateUserAppDto = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, ...dto };

      // Mock para que findOne no falle y para que update devuelva el usuario actualizado
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as any);
      jest.spyOn(prisma.userApp, 'update').mockResolvedValue(updatedUser);

      const result = await service.update(1, dto);

      expect(prisma.userApp.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove()', () => {
    it('should delete a user', async () => {
      // Mock para que findOne no falle
      jest.spyOn(service, 'findOne').mockResolvedValue(mockUser as any);

      const result = await service.remove(1);

      expect(prisma.userApp.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(result).toEqual(mockUser);
    });
  });
});

type UpdateUserAppDto = import('./dto/update-user-app.dto').UpdateUserAppDto;