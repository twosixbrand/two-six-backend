import { Test, TestingModule } from '@nestjs/testing';
import { YearProductionService } from './year-production.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('YearProductionService', () => {
  let service: YearProductionService;

  const mockPrisma = {
    yearProduction: {
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
        YearProductionService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<YearProductionService>(YearProductionService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a year production', async () => {
    const dto = { id: '24', name: '2024' };
    mockPrisma.yearProduction.create.mockResolvedValue({ ...dto });
    const result = await service.create(dto as any);
    expect(result.id).toBe('24');
    expect(mockPrisma.yearProduction.create).toHaveBeenCalledWith({ data: dto });
  });

  it('should find all year productions', async () => {
    mockPrisma.yearProduction.findMany.mockResolvedValue([{ id: '1' }]);
    const result = await service.findAll();
    expect(result).toHaveLength(1);
    expect(mockPrisma.yearProduction.findMany).toHaveBeenCalled();
  });

  it('should find one year production', async () => {
    mockPrisma.yearProduction.findUnique.mockResolvedValue({ id: '24', name: '2024' });
    const result = await service.findOne('24');
    expect(result?.id).toBe('24');
    expect(mockPrisma.yearProduction.findUnique).toHaveBeenCalledWith({ where: { id: '24' } });
  });

  it('should update a year production', async () => {
    const dto = { name: '2025' };
    mockPrisma.yearProduction.update.mockResolvedValue({ id: '24', name: '2025' });
    const result = await service.update('24', dto as any);
    expect(result.name).toBe('2025');
    expect(mockPrisma.yearProduction.update).toHaveBeenCalledWith({
      where: { id: '24' },
      data: dto,
    });
  });

  it('should remove a year production', async () => {
    mockPrisma.yearProduction.delete.mockResolvedValue({ id: '1' });
    const result = await service.remove('1');
    expect(result.id).toBe('1');
    expect(mockPrisma.yearProduction.delete).toHaveBeenCalledWith({ where: { id: '1' } });
  });
});
