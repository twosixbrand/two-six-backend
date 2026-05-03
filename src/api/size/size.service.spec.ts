import { Test, TestingModule } from '@nestjs/testing';
import { SizeService } from './size.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SizeService', () => {
  let service: SizeService;
  let prisma: PrismaService;

  const mockPrisma = {
    size: {
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
        SizeService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SizeService>(SizeService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a size', async () => {
    const dto = { name: 'M' };
    await service.create(dto);
    expect(mockPrisma.size.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should find all sizes', async () => {
    await service.findAll();
    expect(mockPrisma.size.findMany).toHaveBeenCalled();
  });

  it('should find one size', async () => {
    await service.findOne(1);
    expect(mockPrisma.size.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should update a size', async () => {
    const dto = { name: 'L' };
    await service.update(1, dto);
    expect(mockPrisma.size.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: dto,
    });
  });

  it('should remove a size', async () => {
    await service.remove(1);
    expect(mockPrisma.size.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
