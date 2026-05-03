import { Test, TestingModule } from '@nestjs/testing';
import { SeasonService } from './season.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SeasonService', () => {
  let service: SeasonService;
  let prisma: PrismaService;

  const mockPrisma = {
    season: {
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
        SeasonService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SeasonService>(SeasonService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a season', async () => {
    const dto = { name: 'Summer 2026' };
    await service.create(dto);
    expect(mockPrisma.season.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should find all seasons', async () => {
    await service.findAll();
    expect(mockPrisma.season.findMany).toHaveBeenCalled();
  });

  it('should find one season', async () => {
    await service.findOne(1);
    expect(mockPrisma.season.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it('should update a season', async () => {
    const dto = { name: 'Fall 2026' };
    await service.update(1, dto);
    expect(mockPrisma.season.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: dto,
    });
  });

  it('should remove a season', async () => {
    await service.remove(1);
    expect(mockPrisma.season.delete).toHaveBeenCalledWith({ where: { id: 1 } });
  });
});
