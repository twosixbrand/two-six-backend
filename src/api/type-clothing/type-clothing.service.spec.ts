import { Test, TestingModule } from '@nestjs/testing';
import { TypeClothingService } from './type-clothing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('TypeClothingService', () => {
  let service: TypeClothingService;
  let prisma: PrismaService;

  const mockPrisma = {
    typeClothing: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeClothingService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<TypeClothingService>(TypeClothingService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a type clothing', async () => {
    const dto = { id: 'JA', name: 'Jacket' };
    await service.create(dto);
    expect(mockPrisma.typeClothing.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should find all type clothings', async () => {
    await service.findAll();
    expect(mockPrisma.typeClothing.findMany).toHaveBeenCalled();
  });

  it('should find one type clothing', async () => {
    const type = { id: '1', name: 'Jacket' };
    mockPrisma.typeClothing.findUnique.mockResolvedValue(type);
    const result = await service.findOne('1');
    expect(result).toEqual(type);
  });

  it('should throw NotFoundException if type clothing not found', async () => {
    mockPrisma.typeClothing.findUnique.mockResolvedValue(null);
    await expect(service.findOne('99')).rejects.toThrow(NotFoundException);
  });

  it('should update a type clothing', async () => {
    const dto = { name: 'Updated' };
    mockPrisma.typeClothing.findUnique.mockResolvedValue({ id: '1' });
    await service.update('1', dto);
    expect(mockPrisma.typeClothing.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: dto,
    });
  });

  it('should remove a type clothing', async () => {
    mockPrisma.typeClothing.findUnique.mockResolvedValue({ id: '1' });
    await service.remove('1');
    expect(mockPrisma.typeClothing.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
