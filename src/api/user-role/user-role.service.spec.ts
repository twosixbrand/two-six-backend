import { Test, TestingModule } from '@nestjs/testing';
import { UserRoleService } from './user-role.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('UserRoleService', () => {
  let service: UserRoleService;
  let prisma: PrismaService;

  const mockPrisma = {
    userRole: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userApp: {
      findUnique: jest.fn(),
    },
    role: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserRoleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<UserRoleService>(UserRoleService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should assign a role to a user if both exist', async () => {
      const dto = { id_user_app: 1, id_role: 2 };
      mockPrisma.userApp.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.role.findUnique.mockResolvedValue({ id: 2 });
      mockPrisma.userRole.create.mockResolvedValue({ id: 10, ...dto });

      const result = await service.create(dto);

      expect(mockPrisma.userRole.create).toHaveBeenCalledWith({ data: dto });
      expect(result.id).toBe(10);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockPrisma.userApp.findUnique.mockResolvedValue(null);
      await expect(service.create({ id_user_app: 99, id_role: 1 })).rejects.toThrow(
        new NotFoundException('Usuario con ID #99 no encontrado.'),
      );
    });

    it('should throw NotFoundException if role does not exist', async () => {
      mockPrisma.userApp.findUnique.mockResolvedValue({ id: 1 });
      mockPrisma.role.findUnique.mockResolvedValue(null);
      await expect(service.create({ id_user_app: 1, id_role: 99 })).rejects.toThrow(
        new NotFoundException('Rol con ID #99 no encontrado.'),
      );
    });
  });

  describe('findAll', () => {
    it('should return all user roles with relations', async () => {
      await service.findAll();
      expect(mockPrisma.userRole.findMany).toHaveBeenCalledWith({
        include: { user: true, role: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a user role assignment', async () => {
      const userRole = { id: 1, id_user_app: 1, id_role: 1 };
      mockPrisma.userRole.findUnique.mockResolvedValue(userRole);
      const result = await service.findOne(1);
      expect(result).toEqual(userRole);
    });

    it('should throw NotFoundException if assignment not found', async () => {
      mockPrisma.userRole.findUnique.mockResolvedValue(null);
      await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user role assignment', async () => {
      const dto = { id_role: 3 };
      mockPrisma.userRole.findUnique.mockResolvedValue({ id: 1 });
      await service.update(1, dto);
      expect(mockPrisma.userRole.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
    });
  });

  describe('remove', () => {
    it('should delete a user role assignment', async () => {
      mockPrisma.userRole.findUnique.mockResolvedValue({ id: 1 });
      await service.remove(1);
      expect(mockPrisma.userRole.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    });
  });
});
