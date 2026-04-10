import { Test, TestingModule } from '@nestjs/testing';
import { BudgetService } from './budget.service';
import { PrismaService } from '../../../prisma/prisma.service';

describe('BudgetService', () => {
  let service: BudgetService;
  let prisma: PrismaService;

  const mockPrisma = {
    budget: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    },
    journalEntryLine: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAnnualComparison', () => {
    it('should return annual comparison structure', async () => {
      const result = await service.getAnnualComparison(2026);
      expect(result).toHaveProperty('year', 2026);
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('grandTotals');
    });
  });
});
