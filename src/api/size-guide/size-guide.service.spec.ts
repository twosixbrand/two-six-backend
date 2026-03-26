import { Test, TestingModule } from '@nestjs/testing';
import { SizeGuideService } from './size-guide.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SizeGuideService', () => {
  let service: SizeGuideService;

  const mockPrisma = {
    sizeGuide: {
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
        SizeGuideService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SizeGuideService>(SizeGuideService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
